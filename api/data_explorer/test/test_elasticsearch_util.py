from data_explorer.util import elasticsearch_util


def test_convert_to_index_name():
    dataset_name = "Project Baseline"
    assert "project_baseline" == elasticsearch_util.convert_to_index_name(
        dataset_name)


def test_range_to_number():
    def _inner(range_str, expected_number):
        actual_number = elasticsearch_util.range_to_number(range_str)
        assert expected_number == actual_number

    _inner('0.1-0.2', 0.1)
    _inner('1', 1)
    _inner('10-20', 10)
    _inner('10M-20M', 10000000)
    _inner('-20--10', -20)
    _inner('-10-0', -10)


def test_number_to_range():
    def _inner(interval_start, interval, expected_range):
        actual_range = elasticsearch_util.number_to_range(
            interval_start, interval)
        assert expected_range == actual_range

    _inner(.1, .1, '0.1-0.2')
    _inner(1, 1, '1')
    _inner(10, 10, '10-19')
    _inner(10000000, 10000000, '10M-19M')
    _inner(10000000000, 10000000000, '10B-19B')
