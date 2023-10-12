import React from 'react';
import { Dropdown, DropdownButton } from "react-bootstrap";
import { toTitleCase } from '../../../utils';

const FilterSelect = ({
    filters,
    setFilters,
    filterType,
    filterOptions,
    type
  }) => {

    const handleCheckboxChange = (e, optPos) => {
      // if(filterType !== "priority"){
        if(e.target.checked){
          setFilters((prev) => ({
            ...prev,
            [filterType]: prev[filterType].concat(e.target.name),
          }));
        }else{
          filters[filterType].splice(optPos, 1)
          const newFilters = filters[filterType]
          if(optPos > -1){
            setFilters((prev) => ({
              ...prev,
              [filterType]: newFilters
            }));
          }
        }
    }

    return (
        <DropdownButton
        variant="sucsess"
        className='dropdown-btn '
        id={`ticket-filter-${filterType}`}
        title={
          `Filter by ${toTitleCase(filterType)}`
        } >
        {filterType === "assignee" ? 
        filterOptions.map((option) => {
          const optionPosInFilter =filters[filterType].indexOf(option.filterUId)
          return (
          <div key={option.filterUId}
            onClick={(e) => {e.stopPropagation();}}
            className="filters-checkbox p-1">

            <input type="checkbox" 
            id={type === "custom" ? `${filterType}-${option.filterUId}-custom` : `${filterType}-${option.filterUId}`}          
            checked={ optionPosInFilter > -1 && true}
            name={option.filterUId} 
            onChange={(e)=>handleCheckboxChange(e, optionPosInFilter)} />
           
            <label className='ms-1' htmlFor={type === "custom" ? `${filterType}-${option}-custom` : `${filterType}-${option}`}>{option.email}</label>       
          </div>
        )}) : 
        filterOptions.map((option) => {
          const optionPosInFilter = filterType === "priority" ?  filters[filterType].indexOf(option.split(" ")[0].toUpperCase())  : filters[filterType].indexOf(option.toUpperCase())
          return (
            <div
            key={option}
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="filters-checkbox p-1"
          >
            <input type="checkbox" 
            id={type === "custom" ? `${filterType}-${option}-custom` : `${filterType}-${option}`}          
            checked={ optionPosInFilter > -1 && true}
            name={filterType === "priority" ? `${option.split(" ")[0].toUpperCase()}` : `${option.toUpperCase()}`} 
            onChange={(e)=>handleCheckboxChange(e, optionPosInFilter)} />
          <label className='ms-1' htmlFor={type === "custom" ? `${filterType}-${option}-custom` : `${filterType}-${option}`}>{option}</label>   
          </div>    

        )})}
        
      </DropdownButton>
    );
};

export default FilterSelect;