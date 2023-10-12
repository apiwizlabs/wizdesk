import React, { useCallback, useState } from "react";
import { omit } from "lodash";
import { debounceFn } from "../utils/helper";

const useForm = (callback, stateValues) => {
  const [values, setValues] = useState(stateValues);
  const [errors, setErrors] = useState({});
  const validate = (event, name, value) => {
    switch (name) {
      case "username":
        if (value.length <= 0) {
          setErrors({
            ...errors,
            username: "Username cannot be empty",
          });
        } else {
          let newObj = omit(errors, "username");
          setErrors(newObj);
        }
        break;

      case "email":
        if (
          !new RegExp(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          ).test(value)
        ) {
          setErrors({
            ...errors,
            email: "Enter a valid email address",
          });
        } else {
          let newObj = omit(errors, "email");
          setErrors(newObj);
        }
        break;

      case "password":
        if (value.length <= 0) {
          setErrors({
            ...errors,
            password: "Password cannot be empty",
          });
        } else {
          let newObj = omit(errors, "password");
          setErrors(newObj);
        }
        break;

      case "workspaceName":
        if (value.length <= 0) {
          setErrors({
            ...errors,
            workspaceName: "Workspace name cannot be empty",
          });
        } else {
          let newObj = omit(errors, "workspaceName");
          setErrors(newObj);
        }
        break;

      case "colName":
        if (value.length <= 0) {
          setErrors({
            ...errors,
            colName: "Collection name cannot be empty",
          });
        } else {
          let newObj = omit(errors, "colName");
          setErrors(newObj);
        }
        break;

      case "folName":
        if (value.length <= 0) {
          setErrors({
            ...errors,
            folName: "Folder name cannot be empty",
          });
        } else {
          let newObj = omit(errors, "colName");
          setErrors(newObj);
        }
        break;

      default:
        break;
    }
  };

  const handleChange = (event) => {
    // event.persist();

    let name = event.target.name;
    let val = event.target.value;

    handleOnChangeDebounceFn(event, name, val);

    setValues({
      ...values,
      [name]: val,
    });
  };

  const handleSubmit = (event) => {
    if (event) event.preventDefault();

    if (Object.keys(errors).length === 0 && Object.keys(values).length !== 0) {
      callback();
      return true;
    } else {
      return false;
      //TODO: Show a toast here
    }
  };

  const checkValidate = (name, value) => {
    validate(null, name, value);
  };

  const handleOnChangeDebounceFn = useCallback(debounceFn(validate, 1000), []);

  return {
    values,
    errors,
    handleChange,
    handleSubmit,
    checkValidate,
  };
};

export default useForm;
//!new RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/).test(value)
