import Spinner from 'react-bootstrap/Spinner';
import React from 'react'

function BasicLoader() {
  return (
    <div className='d-flex loader-group'>
        <Spinner animation="border" variant="secondary" role="status">
            <span className="visually-hidden">Loading...</span>
        </Spinner>
    </div>
  );
}

export default BasicLoader;