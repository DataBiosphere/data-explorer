from data_explorer.util import elasticsearch_util


def test_convert_to_index_name():
    dataset_name = "Project Baseline"
    assert "project_baseline" == elasticsearch_util.convert_to_index_name(
        dataset_name)


def test_range_to_number():
    def _inner(range_str, expected_number):
        actual_number = elasticsearch_util.range_to_number(range_str)
        assert actual_number == expected_number

    _inner('0.1-0.2', 0.1)
    _inner('1', 1)
    _inner('10-20', 10)
    _inner('10M-20M', 10000000)
