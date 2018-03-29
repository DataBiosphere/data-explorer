import './Header.css';

import React from 'react';
import IconButton from 'material-ui/IconButton';
import {Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';
import FileCloudUpload from 'material-ui/svg-icons/file/cloud-upload';
import {white} from 'material-ui/styles/colors';

function Header(props) {
    const datasetName = props.datasetName
    const totalCount = props.totalCount;

    return (
        <Toolbar className="toolbar">
            <ToolbarGroup firstChild={true}>
                <ToolbarTitle className="datasetName" text={datasetName} />
            </ToolbarGroup>
            <ToolbarGroup>
                <div className="participantCountBox">
                    <div className="totalCountText">
                        {totalCount}
                    </div>
                    <div>Participants</div>
                </div>
                <ToolbarSeparator className="separator" />
                <IconButton tooltip="Export to Saturn">
                    <FileCloudUpload color={white} />
                </IconButton>
            </ToolbarGroup>

        </Toolbar>
    );
}

export default Header;
