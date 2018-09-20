from data_explorer.models.field import Field
from data_explorer.models.fields_response import FieldsResponse


def fields_get():
    """fields_get

    Returns fields.

    rtype: FieldsResponse
    """

    es = Elasticsearch(current_app.config['ELASTICSEARCH_URL'])
    search = Search(
        using=es, index=current_app.config['INDEX_NAME'] + '_fields')
    # Default number of results is 10. We want to get 100.
    search = search[0:100]
    response = search.sort('name.keyword').execute()
    response_fields = response.to_dict()

    fields = []
    fields.append(
        Field(
            name="Age",
            description="Age of participant",
            elasticsearch_name="project.dataset.table.Age"))
    fields.append(
        Field(
            name="RNA name",
            description="RNA sequence",
            elasticsearch_name="project.dataset.table.RNA"))
    fields.append(
        Field(
            name="DNA name",
            description="DNA sequence",
            elasticsearch_name="project.dataset.table.DNA"))
    fields.append(
        Field(
            name="Address",
            description="Mailing address",
            elasticsearch_name="project.dataset.table.Address"))
    fields.append(
        Field(
            name="Phone",
            description="Contact number",
            elasticsearch_name="project.dataset.table.Phone"))
    fields.append(
        Field(
            name="Smoking",
            description="How often person smokes",
            elasticsearch_name="project.dataset.table.Smoke"))
    fields.append(
        Field(
            name="Drinking",
            description="How often person drinks",
            elasticsearch_name="project.dataset.table.Drink"))
    fields.append(
        Field(
            name="Exercise",
            description="Exercise the participant does",
            elasticsearch_name="project.dataset.table.Exercise"))
    return FieldsResponse(fields=fields)
