const functions = require("firebase-functions");
const admin = require("firebase-admin");
const request = require('request');
const axios = require('axios');
const formData = require("form-data");

const REGION = "asia-east1";

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

const line_token = "mutXsXdF95oc9WHAaWm7DwAPQfQ65Cn9x9uz8E6sZad";
const telegram_token = "7820281145:AAFEP0pj2TTTovizKimkVolPCxMh15V2bjU";
const telegram_chat_id = "-4511513228";

function isEmpty(checkValue) {
    if (checkValue === undefined || checkValue === null || checkValue === "" || checkValue + "" === "null") {
        return true;
    }
    return false;
}

exports.helloWorld = functions.region(REGION).https
    .onRequest((request, response) => {
        let provinces = [];
        for (let i = 0; i < 15; i++) {
            provinces[i] = 'กทม' + i;
        }
        sendToTelegram("tttt");
        response.json({ status: true, data: provinces });
    });


exports.onWriteUsers = functions.firestore.document('users/{user_id}')
    .onWrite(async (snap, context) => {

        const before = snap.before.data();
        const original = snap.after.data();
        const user_id = context.params.user_id;

        if (isEmpty(before)) {
            return;
        }

        if (isEmpty(original)) {
            return;
        }

        if (isEmpty(before.phone_number)) {
            let message = "มีการสมัครสมาชิกใหม่จากคุณ ";
            message = message + original.display_name;
            message = message + "\n" + "เบอร์โทร : " + original.phone_number;
            message = message + "\n" + "อีเมล : " + original.email;
            sendNotify(message);
        }



    });

exports.onCreateIssueList = functions.firestore.document('issue_list/{doc_id}')
    .onCreate(async (snap, context) => {

        const original = snap.data();
        const doc_id = context.params.doc_id;

        let message = "มีการแจ้งปัญหาการใช้งานจากคุณ ";
        message = message + original.contact_name;
        message = message + "\n" + "เบอร์โทร : " + original.contact_phone;
        message = message + "\n" + "หัวข้อ : " + original.subject;
        message = message + "\n" + "รายละเอียด : " + original.detail;
        sendNotify(message);

    });

exports.onCreateSuggestList = functions.firestore.document('suggest_list/{doc_id}')
    .onCreate(async (snap, context) => {

        const original = snap.data();
        const doc_id = context.params.doc_id;

        let message = "มีข้อเสนอแนะ ";
        message = message + original.subject;
        message = message + "\n" + "รายละเอียด : " + original.detail;
        sendNotify(message);

    });


exports.onCreatePaymentList = functions.firestore.document('payment_list/{doc_id}')
    .onCreate(async (snap, context) => {

        const original = snap.data();
        const doc_id = context.params.doc_id;

        let message = "มีการแจ้งโอนเงินจาก ";
        message = message + original.customer_name + "(" + original.customer_ref.id + ")";
        message = message + "\n" + "รูปหลักฐานการโอนเงิน : ";
        sendNotify(message, original.image_slip, original.image_slip);

    });


function sendNotify(message, image1, image2) {
    sendToLine(message, image1, image2)
    sendToTelegram(message, image1, image2)
}

function sendToLine(message, image1, image2) {
    // image1,2 is url path

    const data = new formData();
    data.append("message", message);

    if (!isEmpty(image1) && !isEmpty(image2)) {
        data.append("imageThumbnail", image1);
        data.append("imageFullsize", image2);
    }

    const config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "https://notify-api.line.me/api/notify",
        headers: {
            "content-type": "application/json",
            "Authorization": "Bearer " + line_token,
            ...data.getHeaders(),
        },
        data: data,
    };

    try {
        axios.request(config);
    } catch (e) {
        console.error("Error sending : ", error);
    }
}

function sendToTelegram(message, image1, image2) {
    // image1,2 is url path

    const data = new formData();
    let config = {};

    if (!isEmpty(image1) && !isEmpty(image2)) {
        data.append("caption", message);
        data.append("chat_id", telegram_chat_id);
        data.append("photo", image1);
        config = {
            method: "post",
            maxBodyLength: Infinity,
            url: "https://api.telegram.org/bot" + telegram_token + "/sendPhoto",
            data: data,
        };
    } else {
        data.append("text", message);
        data.append("chat_id", telegram_chat_id);
        config = {
            method: "post",
            maxBodyLength: Infinity,
            url: "https://api.telegram.org/bot" + telegram_token + "/sendMessage",
            data: data,
        };
    }
    try {
        axios.request(config);
    } catch (e) {
        console.error("Error sending : ", error);
    }
}

