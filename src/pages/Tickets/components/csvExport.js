import React, { useState, useEffect, useRef, Fragment } from 'react';
import propsTypes from 'prop-types';
import { CSVLink } from 'react-csv';
import { TicketsAPI } from '../../../api/apiConfig';

const CsvExport = ({ children, filterState, orgId, fileHeaders, type, searchValue }) => {
  const [csvData, setCsvData] = useState(null);
  const [disable, setDisable] = useState(false);
  const csvInstance = useRef();


  useEffect(() => {
    if (csvData && csvInstance.current.children?.length) {
      console.log("i got invoked")
      csvInstance.current.children[0].click()   
    }
  }, [csvData]);

  const handleDownload = (e) => {
    console.log("once down")

    let _href = e.target.href;    
    const a = document.createElement('a');
    a.href = _href
    a.download = 'Tickets.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setCsvData(null);
  }

  const handleDownloadClick = async () => {
    console.log("twice down")
    if (disable) {
      return;
    }
    setDisable(true);

    if(type === "ALL"){
      console.log("thrice down")

      const response = await TicketsAPI.getAllTickets();
      let downloadableObj = response.data.data.reduce((acc, curr)=>{
        return [...acc, {...curr, comments: JSON.stringify(curr.comments)} ]
      },[]);
      setCsvData(downloadableObj);
      setDisable(false);

    }else{

      let body = {
        orgId: orgId,
        searchValue
      }

    if(filterState.type.length > 0 )  body.type = filterState.type.toString();
    if(filterState.priority.length > 0) body.priority = filterState.priority.toString();
    if(filterState.status.length > 0) body.status = filterState.status.toString();
    if(filterState.assignee.length > 0) body.assignee = filterState.assignee.toString();

    const newCsvData = await TicketsAPI.getDownloadable(body);
    let downloadableObj = newCsvData.data.ticketsData.reduce((acc, curr)=>{
      return [...acc, {...curr, comments: JSON.stringify(curr.comments)} ]
    },[]);
    setCsvData(downloadableObj);
    setDisable(false);

    }
  }


  return (
    <Fragment>
      <div onClick={handleDownloadClick} >
        {children}
      </div>
      {csvData ?
        <div ref={csvInstance}>
          <CSVLink
            data={csvData}
            headers={fileHeaders}
            filename={"Tickets.csv"}
            onClick={(e) => handleDownload(e)}
          />
        </div>
      : undefined}
    </Fragment>

  );
};

export default CsvExport;

// CsvExport.defaultProps = {
//   children: undefined,
//   disable: false,
//   filterState: {},
//   orgId: "",
// };

// CsvExport.propTypes = {
//   children: propsTypes.node,
//   disable: propsTypes.bool,
//   filterState: propsTypes.object,
//   orgId: propsTypes.string
// };