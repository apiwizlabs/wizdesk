import React, {useState , useEffect} from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
// import { Trash,  Paperclip} from "@phosphor-icons/react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { uploadAttachmentThunk, downloadAttachmentThunk } from '../../../app/features/Ticket/AsyncThunks';
import { TicketsAPI } from '../../../api/apiConfig';
import { useDispatch, useSelector} from "react-redux";
import { useSearchParams } from "react-router-dom";
import { isFulfilled, isRejected } from "@reduxjs/toolkit";
import { useOutletContext } from 'react-router-dom';
import { PaperclipHorizontal, DownloadSimple, Trash, XSquare } from "@phosphor-icons/react";
import { toast } from 'react-toastify';
import Spinner from 'react-bootstrap/Spinner';
import { toggleAttachmentsLoader, toggleDownloadLoader } from '../../../app/features/Ticket/TicketsSlice';

const CommentInput = ({comment, commentIndex, setTicketData, ticketData, isTicketPresent, downloadAttachmentFn , commentCts, viewPreviewFn}) => {
    const [commentAttachments, setCommentAttachments] = useState(null)
    const [showCommAttachments, setShowCommAttachments] = useState(false)
    const [{userEmail}] = useOutletContext();
    // const [currentCommentData, setCurrentCommentData] = useState({
    //     ...comment
    // });
    const [previewData, setPreviewData] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [previewLoading, setPreviewLoading] = useState(false);

  const dispatch = useDispatch();
  const { actionStatus, attachmentKeys, downloadedData } = useSelector((state) => state.tickets);
    const [togglePreview, setTogglePreview] = useState(false)
  

    // useEffect(()=>{
    //     let _ticketData = {...ticketData}
    //     _ticketData.comments[commentIndex] = {...currentCommentData}
    //     setTicketData({..._ticketData})
    // }, [currentCommentData])

    const handleDelete = async (commentIndex) => {
            let _ticketData = {...ticketData}
            _ticketData.comments.splice(commentIndex, 1)
            setTicketData({..._ticketData})
            if(comment.id){
              // console.log(comment.attachments, "COMM ATTAS");
              const res = await TicketsAPI.deleteComment(comment.attachments, searchParams.get('ticketId'), comment.id);
              if(res.status === 200){
                toast.success("Comment Deleted Successfully", {autoClose: 3000})
              }
            }
    }

    const handleDeleteCommAttachment = async (file, attachmentIndex, commentIndex) => {
        let _ticketData = {...ticketData}
        const attachmentList = _ticketData.comments[commentIndex].attachments.map(attachment => attachment)
        attachmentList.splice(attachmentIndex, 1);
        _ticketData.comments[commentIndex].attachments = attachmentList
        setTicketData({..._ticketData})
        console.log(comment, "comment")
        if(comment.id){
          console.log("comment has an id ::: ")
          const res = await TicketsAPI.deleteCommentAttachment(file, searchParams.get('ticketId'), comment.id);
          if(res.status === 200){
            toast.success("Attachment Deleted Successfully", {autoClose: 3000})
          }
          console.log(res, "post att deletion")
        }
      }


    const viewPreview = async (attachmentFileKey) => {
        TicketsAPI.downloadImage({fileKey: attachmentFileKey})
        .then((res) => {
          setPreviewLoading(false)
          const url = window.URL.createObjectURL(new Blob([res.data]));
          if(res.data.type.toString().includes("video")){
            setPreviewData({isVideo: true, url: url, urlStatus: false});
          }else if(res.data.type.toString().includes("image")){
            setPreviewData({isVideo: false, url: url, urlStatus: false})
          }
        })
        .catch((err) => {
          setPreviewLoading(false)
        });
      }

    const handleCommentInputChange = (e) => {
      let _ticketData = {...ticketData}
      _ticketData.comments[commentIndex].text = e.target.value
      setTicketData({..._ticketData})
    }


    const handleAttachmentsUpload = async (files) => {
      dispatch(toggleAttachmentsLoader("loading")) 
      try{
        let maxSizeCount = 50000000;
        const largeFiles = files.filter(item => item.size > maxSizeCount)
        if(files.length > 3 || largeFiles.length > 0){
          throw new Error('Error while uploading attachments');
        }
        const response = await TicketsAPI.uploadAttachments(files);
        if(response.status !== 200){
          dispatch(toggleAttachmentsLoader("error"));
          throw new Error('Error while uploading attachments');
        }
        if(response?.data?.data){
          const filesData = response?.data?.data;
          const filesKeyArray =  filesData.map(fileData => ({fileKey: fileData.key, fileSize: fileData.size}))
          let _ticketData = {...ticketData}
          _ticketData.comments[commentIndex].attachments = filesKeyArray
          setTicketData({..._ticketData})
          dispatch(toggleAttachmentsLoader("fulfilled"));
        }
      }catch(err){
        dispatch(toggleAttachmentsLoader("error"));
        toast.error("Please keep files under 50MB each and upload a maximum of 3 files at a time.");
        return {success : "error"}
        // onHide();
        // handleClose();
      }

    }

    return (
        <>
        {previewData && previewData.url && <div>
          <XSquare onClick={()=>{
            setPreviewData(null)}} 
            className='position-fixed close-img' size={32} />
          {!previewData.isVideo &&  
          <img className='position-fixed preview-img' src={previewData.url} width="100vw" height="100vh" align="center"/>}
          {previewData.isVideo &&  <video className='position-fixed preview-video' src={previewData.url} id="video" controls />}
          </div>}
        <div className='d-flex justify-content-between'>
          <span className='md-txt m-0'>Comment By: {comment.createdBy}</span>
               { comment.createdBy === userEmail && <Button onClick={()=>setTogglePreview(prev => !prev)} className="me-4" variant="link" size="sm">
                {togglePreview ? "Edit Markdown" : "Preview Markdown"}
            </Button>}
        </div>
          <div className='d-flex'>
          {console.log(ticketData.comments[commentIndex].text, "COMMENT INDEX TXT")}

            {comment.createdBy === userEmail ? (togglePreview ? 
            <ReactMarkdown remarkPlugins={[remarkGfm]} children={ticketData.comments[commentIndex].text} className="markdown-preview" /> : 
                 <Form.Control value={comment.text} disabled={!(comment.createdBy === userEmail)} placeholder="Enter Comment Text" 
                 onChange={(e)=>{
                  handleCommentInputChange(e)
                }}  className='mt-2' as="textarea" rows={3} />) : 
                <ReactMarkdown remarkPlugins={[remarkGfm]} children={ticketData.comments[commentIndex].text} className="markdown-preview" />}
           
                <div className='d-flex flex-column align-items-center justify-content-center g-10 ms-2'>
                { comment.createdBy === userEmail && <Trash onClick={(e)=>{
                    e.stopPropagation();
                    handleDelete(commentIndex)
                    }} size={22} />}
                </div>
            </div>
            <div className='d-flex g-10 mt-2 mb-3 justify-content-between align-items-start'>
                    <Form.Group>
                    {!comment.id ?
                    <>
                        <Form.Label visuallyHidden={true}>Multiple files input for comments</Form.Label>
                        <input className='form-control' id={comment.uid} onChange={async (e)=>{
                          const {success} = await handleAttachmentsUpload(Array.from(e.target.files));
                          if(success === "error") {
                            e.target.value = null;
                          }
                          }} type="file" size="sm" multiple disabled={!(comment.createdBy === userEmail)} />
                    </> : <p className='sm-txt'>{commentCts}</p>
                    }
                    </Form.Group>
                    {comment.id && comment.attachments.length > 0 && 
                    <div onClick={()=>setShowCommAttachments(prev => !prev)} className='blue-txt cursor me-5 position-relative'> 
                            { !previewLoading ? showCommAttachments ? "Hide " : "View " : 
                            <div className="spinner-border spinner-border-sm" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div> }
                            
                            {!previewLoading && <PaperclipHorizontal size={22} />}
                  {showCommAttachments && <div onClick={()=>{}} className='position-absolute d-flex flex-column attachments-dropdown'>
                    {comment.attachments.map((file, i) => {
                    const ext = file.fileKey.split(".").slice("-1")[0]
                    return <div className="d-flex justify-content-between p-2" key={file._id} 
                    onClick={()=>{
                        viewPreview(file.fileKey)
                        setPreviewLoading(true)
                      }} >
                      <p>{file.fileKey.split("-")[0]}.{ext}</p>
                      <div className='d-flex g-10'>
                        <Trash className='delete-btn' onClick={(e)=>{
                          e.stopPropagation();
                          handleDeleteCommAttachment(file, i, commentIndex)
                        }} size={22}  />
                      
                        <DownloadSimple size={22} onClick={(e) => {
                          e.stopPropagation();
                          downloadAttachmentFn({ fileKey: file.fileKey });
                        }}/> 
                      </div>
                    </div>})}
                  </div> } 
               </div>}
                   
            </div>
        </>
    );
};

export default CommentInput;