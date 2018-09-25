from data_explorer.util import elasticsearch_util


def test_convert_to_index_name():
    dataset_name = "Project Baseline"
    assert "project_baseline" == elasticsearch_util.convert_to_index_name(
        dataset_name)
