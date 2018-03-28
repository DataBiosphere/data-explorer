import './Header.css';

import React from 'react';

function Header(props) {
    const datasetName = props.datasetName
    const totalCount = props.totalCount;

    return (
        <div className="header">
            {/* TODO(alanhwang): Include the logo here */}
            <div className="headerBox">
                <div className="datasetName">{datasetName}</div>
                <div className="totalCountBoxText">
                    <div className="totalCount">{totalCount}</div>
                    <div>Participants</div>
                </div>
            </div>
        </div>
    );
}

export default Header;
