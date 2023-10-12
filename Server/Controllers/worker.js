const { parentPort, isMainThread, workerData  } = require("worker_threads");
  const {getUserDisplayName, createMultipleTickets} = require("../Controllers/Tickets.controller");
  const {getJiraAttachment} = require("../Controllers/FileManagement/FileDownload");
// const { log } = require("console");
const logger = require("../utils/logger");
global.logger = logger
// Receive message from the parent

const processTickets = async ({rowsList, isAttachmentRequired, jiraUserData, foundClientEmail, foundClientId, foundSupportId, foundSupportEmail, orgId, importerEmail }) => {

    try{

        if (!String.prototype.replaceAll) {
            String.prototype.replaceAll = function(str, newStr){
        
                // If a regex pattern
                if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
                    return this.replace(str, newStr);
                }
        
                // If a string
                return this.replace(new RegExp(str, 'g'), newStr);
            };
        }
    let importedTicketsList = [];
    let displayNames = {};
    let skippedAttachments = [];

    for(let i = 0; i < rowsList.length; i++){
        let attachmentList = [];
        let commentsList = [];
        let taskType = "TASK";
        let taskStatus = "READY";
        let taskPriority = "MAJOR";
        let isSkipped = false;
        switch(rowsList[i]["Issue Type"]){
            case "Bug":
                taskType = "BUG"
                break;
            case "Epic":
                isSkipped = true;
                break;
            case "Story":
                taskType = "STORY"
                break;
            case "Task":
                taskType = "TASK"
                break;
            case "Improvement":
                taskType = "TASK"
                break;
            case "New Feature":
                taskType = "TASK"
                break;
            default:
                taskType = "TASK"
                break;
        }
        if(isSkipped === true){
          continue;
        }
        switch (rowsList[i]["Status"]) {
          case "To Do":
              taskStatus = "READY"
              break;
          case "In Progress":
              taskStatus = "IN PROGRESS"
              break;
          case "In Review":
              taskStatus = "IN PROGRESS"
              break;
          case "User Validation":
              taskStatus = "USER VALIDATION"
              break;
          case "Done":
              taskStatus = "DONE"
              break;
          default:
              taskStatus = "READY"
              break;
        }
        switch (rowsList[i]["Priority"]) {
        case "Highest":
            taskPriority = "CRITICAL"
            break;
        case "High":
            taskPriority = "MAJOR"
            break;
        case "Medium":
            taskPriority = "MAJOR"
            break;
        case "Low":
            taskPriority = "MINOR"
            break;
        case "Lowest":
            taskPriority = "ENHANCEMENT"
            break;
        default:
            taskPriority = "MAJOR"
            break;
        }

        const rmImgregex = /(![^!]+\.(?:png|jpg|jpeg|gif|bmp|svg|mp4|mov))\|width=\d+,\s*height=\d+/ig;

        for (const [key, value] of Object.entries(rowsList[i])) {
            
            if(key.includes("Comment")){
                logger.info(value, "COMMENT VALUE CONCOLE LOG")
                const commentParts = value.split(";")
                const commentText = commentParts[commentParts.length - 1]
                logger.info(commentText, "COMMENT VALUE CONCOLE LOG")

                if(!isAttachmentRequired && commentText){
                        commentsList.push({text: commentText.toString().replaceAll(rmImgregex, '$1'), 
                            createdBy: foundClientEmail || "", attachments: []})                   
                }else if(commentText){
                        const commentContent = commentText.toString().replaceAll(/\n/g, " ").replaceAll(rmImgregex, '$1');
                        const regex = /\[~accountid:(.*?)\]/g;
                        const accountIds = [];
                        let match;
                        while ((match = regex.exec(commentContent)) !== null) {
                            accountIds.push(match[1]);
                        }
                        if(accountIds.length > 0){
                            let uniqueIds = [...new Set(accountIds)]
                            for(let i = 0; i < uniqueIds.length; i++) {
                                if(!displayNames[uniqueIds[i]]){
                                    try{
                                        const {success, name} = await getUserDisplayName(jiraUserData, uniqueIds[i]);
                                        if(success){
                                            displayNames[uniqueIds[i]] = name;
                                        }else{
                                            return parentPort.postMessage({ error: true, message: "get user display names failed" })
                                        }
                                    }catch(err){
                                        return parentPort.postMessage({ error: true, message: "get user display names failed" })
                                    }
                                }
                            }
                            const formattedComment = commentContent.replace(regex, (match, accountId) => {
                                const name = displayNames[accountId] || "Unknown";
                                return `${name}`;
                            });
                            commentsList.push({text: formattedComment.replace(/['"]/g, '\\$&'), createdBy: foundClientEmail || "", attachments: []})
                            
                        }else{
                            commentsList.push({text: commentContent.replace(/['"]/g, '\\$&'),  createdBy: foundClientEmail || "", attachments: []})
                        }                   
                }
            } else if(key.includes("Attachment") && isAttachmentRequired){
                const attachmentParts = value.split(";")
                const url = attachmentParts[attachmentParts.length - 1]
                const urlParts = url.split("/")
                const id = urlParts[urlParts.length - 1]
                const name = attachmentParts[attachmentParts.length - 2]
                attachmentList.push({fileName: name, fileId: id });
            }           
    }



          if(isSkipped === true){
            continue;
          }
          else{
                let formattedDescription = null;
                let descriptionContent = "";

                if(rowsList[i]?.Description && rowsList[i]?.Description?.length > 0 && isAttachmentRequired){
                    descriptionContent = rowsList[i].Description.toString().replaceAll(rmImgregex, '$1');
                    const regex = /\[~accountid:(.*?)\]/g;
                    const accountIds = [];
                    let match;
                    while ((match = regex.exec(descriptionContent)) !== null) {
                        accountIds.push(match[1]);
                    }
                    if(accountIds.length > 0){
                      for(let k = 0; k < accountIds.length; k++ ){
                        if(!displayNames[accountIds[k]]){
                            const {success, name} = await getUserDisplayName(jiraUserData, accountIds[k]);
                            if(success){
                              displayNames[accountIds[k]] = name
                            }else{
                                return parentPort.postMessage({ error: true, message: "get user display names failed" })
                            }
                        }}
                        formattedDescription = descriptionContent.replace(regex, (match, accountId) => {
                            const name = displayNames[accountId] || "Unknown";
                            return `${name}`;
                          });
                    }                 
                }

                if(isAttachmentRequired){
                  let downloadResponses= []
                  for(let j = 0; j < attachmentList.length; j++){
                          const apiInputValues = {fileName: attachmentList[j].fileName, fileId: attachmentList[j].fileId, ...jiraUserData  }
                              const {data, success, attachmentError, fileName, fileId} = await getJiraAttachment({...apiInputValues});
                              if(success && (data?.key || data?.Key)){
                                logger.info(success, data?.Key)
                                data?.Key ? downloadResponses.push({fileKey: data?.Key}) : downloadResponses.push({fileKey: data?.key}) 
                              }else{
                                if(attachmentError){
                                    skippedAttachments.push(`${rowsList[i]["Issue key"]} - ${fileId}/${fileName}`)
                                    continue;
                                }
                            }
                  }
                  logger.info("SUMMARY logger :: ",rowsList[i].Summary);
                  importedTicketsList.push({
                    name: rowsList[i].Summary?.toString().replaceAll(rmImgregex, '$1') || "",
                    description: formattedDescription ? formattedDescription : (descriptionContent || ""),
                    comments: commentsList.reverse(),
                    attachments: [...downloadResponses],
                    type: taskType,
                    status: taskStatus,
                    priority: taskPriority,
                    createdBy: foundClientId || "",
                    assignee: foundSupportId || "",
                    isImported: true,
                })
                }                        
                else if(!isAttachmentRequired ){
                    importedTicketsList.push({
                        name: rowsList[i].Summary?.toString().replaceAll(rmImgregex, '$1') || "",
                        description: rowsList[i].Description?.toString().replaceAll(rmImgregex, '$1') || "",
                        comments: commentsList.reverse(),
                        attachments: [],
                        type: taskType,
                        status: taskStatus,
                        priority: taskPriority,
                        createdBy: foundClientId || "",
                        assignee: foundSupportId || "",
                        isImported: true,
                    })
                }
            }
            if(rowsList[i].Summary.includes("Portal")){
                logger.info("TICKET LOGGER AFTER:: ",JSON.stringify(rowsList[i]))
              }
    }  
    logger.info("IMPORTED TICKETS LIST", JSON.stringify(importedTicketsList));
    const {success} = await createMultipleTickets({orgId: orgId, ticketsList: importedTicketsList, importerEmail, skippedAttachments})
    if(success){
        return parentPort.postMessage({success: true})
    }else{
        return parentPort.postMessage({ error: true, message: "multiple ticket creation failed" })
    }
}
catch(err){
    logger.info(err, "CATCH ERROR");
    return parentPort.postMessage({ error: true,  message: "import tickets worker failed" })
}

}


if(!isMainThread){
    processTickets(workerData)
}
