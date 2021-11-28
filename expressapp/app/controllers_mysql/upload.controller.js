const Constants = require('../../config/constants.js');
const connection = require('./mysql.controller');

exports.upload = (req, res) => {
    console.log(req);
    console.log(req.files);


    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send({
            success: false,
            data: null,
            message: 'No files were uploaded.'
        });
    }

    let uploadedFile = req.files.uploadedFile;

    console.log(uploadedFile);


    if (!uploadedFile.size) {
        return res.status(400).send({
            success: false,
            data: null,
            message: 'File is empty.'
        });
    }

    if (!uploadedFile.size > 1000000) {
        return res.status(400).send({
            success: false,
            data: null,
            message: 'File is too large. The maximum allowed size is 1MB.'
        });
    }

    var mime_type = uploadedFile.mimetype;
    var file_name = uploadedFile.name;
    if (mime_type == "image/png" || mime_type == "image/jpeg" || mime_type == "application/pdf" || mime_type == "text/plain"
        || mime_type == "application/octet-stream" || mime_type == "application/vnd.oasis.opendocument.spreadsheet" || mime_type == "application/x-zip-compressed") {
        let file_type = ``;
        if (mime_type == "image/png" || mime_type == "image/jpeg") {
            file_type = "jpg";
        } else if (file_name.endsWith("pdf")) {
            file_type = "pdf";
        }
        else if (file_name.endsWith("txt")) {
            file_type = "txt";
        }
        else if (file_name.endsWith("docx")) {
            file_type = "docx";
        }
        else if (file_name.endsWith("doc")) {
            file_type = "doc";
        }
        else if (file_name.endsWith("xlsx")) {
            file_type = "xlsx";
        }
        else if (file_name.endsWith("xls")) {
            file_type = "xls";
        }
        else if (file_name.endsWith("csv")) {
            file_type = "csv";
        }
        let splits = uploadedFile.name.split(".");
        let ext = splits[splits.length - 1];

        // Use the mv() method to place the file somewhere on your server
        let timestamp = (new Date()).toISOString().replace(/:/g, "__");
        let Upload_path = "";
        if (req.body.uploadedFileType == 'Requirements') Upload_path = Constants.REQUIREMENT_UPLOAD_PATH;
        else if (req.body.uploadedFileType == 'BusinessRules') Upload_path = Constants.REQUIREMENT_BUSINESS_RULES_UPLOAD_PATH;
        else Upload_path = Constants.UPLOAD_PATH;

        console.log(Upload_path)

        uploadedFile.mv(Upload_path + "FILE__" + timestamp + "." + ext, function (err) {
            if (err)
                return res.status(500).send({
                    success: false,
                    data: err,
                    message: 'No files were uploaded.'
                });

            res.send({
                success: true,
                data: { filepath: "FILE__" + timestamp + "." + ext },
                message: 'File uploaded.'
            });
        });
    } else {
        return res.status(400).send({
            success: false,
            data: null,
            message: 'File is not an image.'
        });
    }
}

// This Api Used Update task_file table records 
exports.Edit_upload_info = (req, res) => {
    console.log("Enter here ")

    let editQuery = `Update task_files set Deleted='Y',DeletedBy='${req.body.DeletedBy}'
    Where FileURL='${req.body.FileURL}' `;

    console.log(editQuery);
    connection.query(editQuery, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: null
        });
    });


}

// This Api Used Update task_file table records 
exports.Edit_Feedback_upload_info = (req, res) => {
    console.log("Enter here ")

    let editQuery = `Update feedback_files set Deleted='Y',DeletedBy='${req.body.DeletedBy}'
    Where FileURL='${req.body.FileURL}' `;

    console.log(editQuery);
    connection.query(editQuery, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: null
        });
    });


}

// This Api Used Update task_file table records 
exports.Edit_Requirement_upload_info = (req, res) => {
    console.log("Enter here ")

    let editQuery = `Update requirement_files set Deleted='Y',DeletedBy='${req.body.DeletedBy}'
    Where FileURL='${req.body.FileURL}' `;

    console.log(editQuery);
    connection.query(editQuery, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: null
        });
    });

}

// THIS API is Used to Update Business_Rule_file Attachment Record 

exports.delete_business_rule_attachment_upload_info = (req, res) => {

    let deleteQuery = `DELETE FROM business_rule_files WHERE BusinessRuleFileId = '${req.body.BusinessRuleFileId}';`;

    console.log(deleteQuery);
    connection.query(deleteQuery, function (obj) {
        res.send({
            success: obj.error == null,
            message: obj.error || `Success`,
            data: null
        });
    });

}