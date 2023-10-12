import jwtDecode from "jwt-decode";
import config from "../config";

export const getLoggedInUser = () => {
  return jwtDecode(localStorage.getItem("token"));
};

export const logout = () => {
  localStorage.removeItem("token");
  window.location.href = "/";
};

export function getEnv(name) {
  const url = window.env[name] || process.env[name];
  return url;
}

export const passwordRegex = /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[@$!%*~`;:><,/."'?&#^)(+=\-_}{[\]])[a-zA-Z\d@$#+=^()|`~.><,/:;"'!%*?&\-_}{[\]^()]{6,}$/;


export const encryptPassword = (password) => {
  const JSEncrypt = require("jsencrypt").default;
	const encrypt = new JSEncrypt({});
	encrypt.setPublicKey(config.PUBLIC_KEY);
	return encrypt.encrypt(password);
};

export const isValidPhonenumber = (value) => {
  return (/^\d{7,}$/).test(value.replace(/[\s()+\-\.]|ext/gi, ''));
}

export function debounceFn(fn, intervalTime = 1000) {
  let timeoutId;

  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, intervalTime);
  };
}

export const toTitleCase = (str) => {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

const formatCols = (cols) => {
  let _inc = {}
  let _cols = []
  for(let c of cols)
  {
    if(!_inc[c]) {
      _inc[c] = 1;
      _cols.push(c)
    }
    else {
      _cols.push(`${c}_${_inc[c]}`);
      _inc[c]++;
    }
  }

  return _cols;
}

export const createJsonFromCsvArr = (arr) => {
  let cols = arr.shift();

  cols = formatCols(cols);

  let arrOfJson = [];

  for(let row of arr)
  {
    let obj = {}
    for(let index in cols)
    {
      let col = cols[index];
      if(row[index] && row[index].trim()){
        obj[col] = row[index];
      }
    }

    if(obj && Object.keys(obj).length > 0){
      arrOfJson.push(obj);
    }
   
  }
  
  return arrOfJson;
}
