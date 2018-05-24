from data_explorer import dataset_faceted_search


def test_convert_to_index_name():
    dataset_name = "Project Baseline"
    assert "project_baseline" == dataset_faceted_search.convert_to_index_name(
        dataset_name)
