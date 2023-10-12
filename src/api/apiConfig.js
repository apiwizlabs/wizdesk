import axios from "axios";
import { logout } from "../utils";
import { toast } from "react-toastify";
import config from "../config";

let headers = {
Accept: "application/json, text/plain, */*",
"Content-Type": "application/json",
"Access-Control-Allow-Origin": "*",
};

let securedHeaders = {
    ...headers,
    authorization: `Bearer ${localStorage.getItem("userToken")}`,
};
  
let fileUploadHeaders = {
...securedHeaders,
"Content-Type": "multipart/form-data",
};


const errorCallback = (error) => {
    const { response } = error;
    console.log("ERROR OBJECT :: ",error);
    if(error.config.url === "/file/upload/multiple"){
      console.log("ATTACHMENTS ERROR");
      return error;
    }
    console.log(response, "error thrown");
    if (response.status === 403) {
      toast.error(`${response.data.message}, UnAuthorised Access`, {autoClose: 2500});
      localStorage.removeItem('userToken');
      window.location.href = "/login";
    }
    else if(response.status === 404){
      window.location.href = "/notfound";    
    }
    else if(response.status === 500 || response.status === 400){
      console.log(response, "error thrown")
      toast.error("Unexpected Error Occurred. Try Again later.", {autoClose: 3000});
    }else if(response.status === 401){
      console.log(response, "error thrown")
      toast.error(`${response.data.message}`, {autoClose: false});      
    }
      return response
};

const uploadFileInstance = axios.create({
  baseURL: config.API_BASE_URL,
  headers: fileUploadHeaders,
});

const axiosInstance = axios.create({
    baseURL: config.API_BASE_URL,
    headers: securedHeaders,
});

axiosInstance.interceptors.response.use((response) => response, errorCallback);
uploadFileInstance.interceptors.response.use((response) => response, errorCallback);

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("userToken");
  if(token){
    config.headers.authorization = `Bearer ${token}`
  }
  return config;
});
uploadFileInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("userToken");
  if(token){
    config.headers.authorization = `Bearer ${token}`
  }
  return config;
});


export const EngineeringAPI = {
    loginUser(data) {
      return axiosInstance.post("/auth/login", {
        ...data,
      });
    },
    googleSignup(data) {
      return axiosInstance.post("/auth/google/signup", {
        ...data,
      });
    },
    resetPassword(data) {
      return axiosInstance.post("/auth/reset", {
        ...data,
      });
    },
    updatePassword(data) {
      return axiosInstance.post("/auth/reset/password", {
        ...data,
      });
    },
    basicUserLogin(data) {
      return axiosInstance.post("/auth/basiclogin", {
        ...data,
      })
    },
    userRegistrationDummy(data) {
      return axiosInstance.post("/auth/dummysignup", {
        ...data,
      })
    },
    getAllSupportUsers() {
      return axiosInstance.get("/auth/support")
    },
    getAllClientUsers() {
      return axiosInstance.get("/auth/client")
    },
    getSupportUsersByOrg({orgId}) {
      return axiosInstance.get(`/auth/support/${orgId}`)
    },
    userSignup(data) {
      return axiosInstance.post("/auth/signup", {
        ...data
      })
    },
    getUserByEmail(userEmail) {
      return axiosInstance.get(`/auth/user/${userEmail}`)
    },
    updateUserByEmail(userEmail, {name, phone}) {
      return axiosInstance.post(`/auth/user/${userEmail}`,{
        name, phone
      })
    },
    getAllInvitedUsers(){
      return axiosInstance.get('/auth/invites')
    },
    lockUserById(userId){
      return axiosInstance.post(`/auth/lock/${userId}`)
    },
    unlockUserById(userId){
      return axiosInstance.post(`/auth/unlock/${userId}`)
    },
    deleteUserById(userId){
      return axiosInstance.post(`/auth/delete/${userId}`)
    }
  };

  export const OrganisationAPI = {
    createOrganisation({orgBody}) {
      return axiosInstance.post("/organisation", {
        ...orgBody
      })
    },
    getAllOrganisations() {
      return axiosInstance.get("/organisation")
    },
    deleteOrganisation({orgId}) {
      return axiosInstance.delete(`/organisation/${orgId}`)
    },
    updateOrganisation({orgId, orgBody}) {
      return axiosInstance.put(`/organisation/${orgId}`, {
        ...orgBody
      })
    },
    getOrganisationById({orgId}) {
      return axiosInstance.get(`/organisation/${orgId}`)
    }
  }

  export const ViewsAPI = {
    createView({viewBody, orgId}){
      return axiosInstance.post(`/views/${orgId}`, {
        ...viewBody
      })
    },
    deleteView({viewID}){
      return axiosInstance.delete(`/views/${viewID}`)
    },
    getViews({orgId}){
      return axiosInstance.get(`/views/${orgId}`)
    }
  }

  export const TicketsAPI = {
    createTicket({orgId, ticketBody}) {
      return axiosInstance.post(`/tickets/org/${orgId}`, {
        ...ticketBody
      })
    },
    getDownloadable({orgId, type, priority, status, assignee, searchValue}){
      return axiosInstance.get(`/tickets/download/${orgId}?search=${searchValue}&type=${type}&priority=${priority}&status=${status}&assignee=${assignee}`)
    },
    getTicketsByOrg(orgId, pageLimit, currentPage, searchValue, type, priority, status, assignee){
      return axiosInstance.get(`/tickets/org/${orgId}?page=${currentPage}&limit=${pageLimit}&search=${searchValue}&type=${type}&priority=${priority}&status=${status}&assignee=${assignee}`)
    },
    getAllTickets(){
      return axiosInstance.get('/tickets')
    },
    getTicketById({ticketId}) {
      return axiosInstance.get(`/tickets/${ticketId}`)
    },
    updateTicketById({ticketId, ticketBody}) {
      return axiosInstance.put(`/tickets/${ticketId}`, {
        ...ticketBody
      })
    },
    deleteCommentById({commentId}) {
      return axiosInstance.delete(`/tickets/comments/${commentId}`)
    },
    deleteTicketById({ticketId, orgId }) {
      return axiosInstance.delete(`/tickets/${ticketId}/${orgId}`)
    },
    uploadAttachments(filesObj) {
      if(filesObj.length > 0){
        const formData = new FormData();
        filesObj.map(fileObj => formData.append("file", fileObj, fileObj.name) )
        return uploadFileInstance.post("/file/upload/multiple", formData);
      }
    },
    getJiraAttachment({fileName, fileId, domainUrl, apiKey, jiraEmail}){

      return axios.get(`/file/jira/${fileName}/${fileId}`,{
        responseType: "blob",
        baseURL: config.API_BASE_URL,
        headers: {
          jiraHost: domainUrl,
          jiraApikey: apiKey,
          jiraEmail: jiraEmail,
          ...securedHeaders
        }
      })
    },
    getDisplayName({accountId, domainUrl, apiKey, jiraEmail}){

      return axios.get(`/tickets/jira/username/${accountId}`,{
        baseURL: config.API_BASE_URL,
        headers: {
          jiraHost: domainUrl,
          jiraApikey: apiKey,
          jiraEmail: jiraEmail,
          ...securedHeaders
        }
      })
    },
    createMultipleTickets({orgId, ticketsList}){
      return axiosInstance.post(`/tickets/multiple/org/${orgId}`, {
        ticketsList
      })
    },
    uploadImage(fileObj) {
      const formData = new FormData();
      formData.append("file", fileObj, fileObj.name);
      return uploadFileInstance.post("/file/upload/single", formData);
    },
    deleteTicketAttachment(file, ticketId){
      console.log(file)
      return axiosInstance.post(`/file/delete-ticket-attachment/${ticketId}`, {fileKey: file.fileKey, fileId: file._id})
    },
    deleteCommentAttachment(file, ticketId, commentId){
      console.log(file, "delete comm att", commentId, ticketId);
      return axiosInstance.post(`/file/delete-comment-attachment/${ticketId}/${commentId}`, {fileKey: file.fileKey, fileId: file._id})
    },
    deleteComment(files, ticketId, commentId){
      console.log(files)
      return axiosInstance.post(`/file/delete-comment/${ticketId}/${commentId}`, {files})
    },
    downloadImage({ fileKey }) {
      return axiosInstance.get(`/file/view/${fileKey}`, {
        responseType: "blob",
      });
    },
    handleImportTickets({rowsList, orgId, supportUser, clientUser, isAttachmentRequired, jiraUserData}){
      return axiosInstance.post(`/tickets/import/${orgId}`, {
        rowsList,
        supportUser,
        clientUser,
        isAttachmentRequired,
        jiraUserData,
      })
    }
  }

  export const EmailAPI = {
    inviteUserByOrg({orgId, inviteEmails}) {
      return axiosInstance.post(`/email/inviteUser/${orgId}`, {
        inviteEmails
      })
    },
    failedImports({importerEmail, orgId}){
      return axiosInstance.post(`/email/failedImport/${importerEmail}/${orgId}`);
    },
    resendInvite(inviteEmail, orgId){
      return axiosInstance.post(`/email/resendInvite/${inviteEmail}/${orgId}`)
    },
    disableInvite({inviteId}){
      return axiosInstance.post(`/email/disableInvite/${inviteId}`)
    },
    enableInvite({inviteId}){
      return axiosInstance.post(`/email/enableInvite/${inviteId}`)
    }
  }