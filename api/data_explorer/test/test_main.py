from data_explorer import __main__


def test_convert_to_index_name():
    dataset_name = "Project Baseline"
    assert "project_baseline" == __main__._convert_to_index_name(dataset_name)
