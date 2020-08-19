import urllib.parse
from elasticsearch_dsl import HistogramFacet

from flask import current_app


def _get_range_clause(column, value, bucket_interval):
    """Returns an SQL clause specifying that column is in the range
    specified by value. Uses bucket_interval to avoid potentially
    ambiguous ranges such as 1.0B-1.9B, which really means [1B, 2B).
    """
    if value[0] == '-':
        # avoid minus sign with split
        arr = value[1:].split('-', 1)
        arr[0] = '-' + arr[0]
    else:
        arr = value.split('-', 1)
    if len(arr) > 1:
        low = arr[0]
        high = arr[1]
    else:
        return column + " = " + value
    if low.endswith('M'):
        low = int(round(float(low[:-1]) * 1000000))
        high = low + bucket_interval
    elif low.endswith('B'):
        low = int(round(float(low[:-1]) * 1000000000))
        high = low + bucket_interval
    elif '.' not in low:
        low = int(low)
        high = low + bucket_interval

    # low is inclusive, high is exclusive
    # See https://github.com/elastic/elasticsearch-dsl-py/blob/master/elasticsearch_dsl/faceted_search.py#L125
    return column + " >= " + str(low) + " AND " + column + " < " + str(high)


def _get_table_and_clause(es_field_name, field_type, value, bucket_interval,
                          sample_file_column_fields, is_time_series,
                          time_series_column):
    """Returns a table name and a single condition of a WHERE clause,
    eg "((age76 >= 20 AND age76 < 30) OR (age76 >= 30 AND age76 < 40))".
    """
    sample_file_type_field = False

    if es_field_name.startswith('samples.'):
        es_field_name = es_field_name.replace('samples.', '')
        # Check if this is one of the special '_has_<file_type>' facets.
        stripped = es_field_name.replace('_has_', '')
        if stripped in sample_file_column_fields:
            es_field_name = sample_file_column_fields[stripped]
            sample_file_type_field = True
    if is_time_series:
        table_name, column, tsv = es_field_name.rsplit('.', 2)
        tsv = tsv.replace('_', '.')
        if tsv == 'Unknown':
            tsv = 'NULL'
            op = 'IS'
        else:
            op = '='
        assert not sample_file_type_field
        if field_type == 'text':
            clause = '%s = "%s" AND %s %s %s' % (column, value,
                                                 time_series_column, op, tsv)
        elif field_type == 'boolean':
            clause = '%s = %s AND %s %s %s' % (column, value,
                                               time_series_column, op, tsv)
        else:
            clause = '%s AND %s %s %s' % (_get_range_clause(
                column, value, bucket_interval), time_series_column, op, tsv)
    else:
        table_name, column = es_field_name.rsplit('.', 1)
        if sample_file_type_field:
            if value == True:
                clause = '%s IS NOT NULL' % column
            else:
                clause = '%s IS NULL' % column
        elif field_type == 'text':
            clause = '%s = "%s"' % (column, value)
        elif field_type == 'boolean':
            clause = '%s = %s' % (column, value)
        else:
            clause = _get_range_clause(column, value, bucket_interval)
    return table_name, column, clause


def _get_bucket_interval(facet):
    if isinstance(facet, HistogramFacet):
        return facet._params['interval']
    elif hasattr(facet, '_inner'):
        return _get_bucket_interval(facet._inner)
    else:
        return None


def _get_all_participants_query():
    participant_id = current_app.config['PARTICIPANT_ID_COLUMN']
    query = 'SELECT DISTINCT %s FROM (' % participant_id
    query += 'SELECT %s FROM `%s`' % (participant_id,
                                      current_app.config['TABLES'][0])
    for table in current_app.config['TABLES'][1:]:
        query += ' UNION DISTINCT SELECT %s FROM `%s`' % (participant_id,
                                                          table)
    query += ')'
    return query


def get_sql_query(filters, extra_facets_dict):
    participant_id_column = current_app.config['PARTICIPANT_ID_COLUMN']
    sample_file_column_fields = {
        k.lower().replace(" ", "_"): v
        for k, v in current_app.config['SAMPLE_FILE_COLUMNS'].items()
    }
    time_series_column = current_app.config['TIME_SERIES_COLUMN']

    if not filters or not len(filters) or filters == ['']:
        return _get_all_participants_query()

    # facet_table_clauses must have two levels of nesting (es_field_name, table_name)
    # because clauses from the same column are OR'ed together, whereas clauses
    # from different columns are AND'ed together.
    facet_table_clauses = {}
    for filter_str in filters:
        filter_str = urllib.parse.unquote(filter_str)
        splits = filter_str.rsplit('=', 1)
        es_field_name = splits[0]
        value = splits[1]
        field_type = ''
        is_time_series = False
        bucket_interval = None
        if es_field_name in current_app.config['FACET_INFO']:
            field_type = current_app.config['FACET_INFO'][es_field_name][
                'type']
            is_time_series = current_app.config['FACET_INFO'][
                es_field_name].get('time_series_field', False)
            bucket_interval = _get_bucket_interval(
                current_app.config['FACET_INFO'][es_field_name]['es_facet'])
        elif es_field_name in extra_facets_dict:
            field_type = extra_facets_dict[es_field_name]['type']
            is_time_series = extra_facets_dict[es_field_name].get(
                'time_series_field', False)
            bucket_interval = _get_bucket_interval(
                extra_facets_dict[es_field_name]['es_facet'])
        table_name, column, clause = _get_table_and_clause(
            es_field_name, field_type, value, bucket_interval,
            sample_file_column_fields, is_time_series, time_series_column)

        if es_field_name not in facet_table_clauses:
            facet_table_clauses[es_field_name] = {}
        if table_name not in facet_table_clauses[es_field_name]:
            facet_table_clauses[es_field_name][table_name] = []
        facet_table_clauses[es_field_name][table_name].append(clause)

    # Map from table name to list of where clauses.
    table_wheres = {}
    table_num = 1
    table_select = '(SELECT %s FROM `%s` WHERE %s)'
    query = 'SELECT DISTINCT t1.%s FROM ' % participant_id_column

    def _append_to_query(existing, new, join, table_num):
        return existing + join if table_num > 1 else existing + new

    # Handle the clauses on a per-facet level.
    for es_field_name, table_clauses in facet_table_clauses.items():
        table_wheres_current_facet = {}
        for table_name, clauses in table_clauses.items():
            where = ''
            for clause in clauses:
                if len(where) > 0:
                    where += ' OR (%s)' % clause
                else:
                    where = '(%s)' % clause
            table_wheres_current_facet[table_name] = where

        if len(table_wheres_current_facet) == 1:
            # If all of the facet where caluses are on the same table, add it
            # to the table_wheres map for coalescing by table below.
            # All normal, non-"_has_sample_type" facets fall under this case.
            if table_name not in table_wheres:
                table_wheres[table_name] = []
            table_wheres[table_name].append(
                table_wheres_current_facet[table_name])
        else:
            # Normally, different columns are AND'ed together.
            # Different columns within a "_has_sample_type" facet are OR'ed together.
            # OR is done using FULL JOIN in case columns are from different tables.
            for table_name, where in table_wheres_current_facet.items():
                select = table_select % (participant_id_column, table_name,
                                         where)
                table = '%s t%d' % (select, table_num)
                join = ' FULL JOIN %s ON t%d.%s = t%d.%s' % (
                    table, table_num - 1, participant_id_column, table_num,
                    participant_id_column)
                query = _append_to_query(query, table, join, table_num)
                table_num += 1

    # Coalesce all where clauses for facets that span a single table
    # using INTERSECT DISTINCT. Cannot just use one WHERE clause with
    # AND's because multiple rows may have the same participant id for
    # time series data.
    for table_name, wheres in table_wheres.items():
        intersect_clause = ''
        for where in wheres:
            if len(intersect_clause) > 0:
                intersect_clause += ' INTERSECT DISTINCT '
            intersect_clause += table_select % (participant_id_column,
                                                table_name, where)

        select = '(%s)' % (intersect_clause)
        table = '%s t%d' % (select, table_num)
        join = ' INNER JOIN %s ON t%d.%s = t%d.%s' % (
            table, table_num - 1, participant_id_column, table_num,
            participant_id_column)
        query = _append_to_query(query, table, join, table_num)
        table_num += 1

    return query