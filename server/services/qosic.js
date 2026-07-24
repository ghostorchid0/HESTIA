const axios = require('axios');
const config = require('../config');

const TOGOCEL_PREFIXES = ['70', '71', '72', '73', '90', '91', '92', '93'];
const MOOV_PREFIXES = ['78', '79', '96', '97', '98', '99'];

function isConfigured() {
  return config.qosic.username && config.qosic.password && config.qosic.clientId;
}

function normalizeMsisdn(phone) {
  if (!phone) return '';
  let msisdn = phone.replace(/\D/g, '');
  if (msisdn.startsWith('00')) msisdn = msisdn.slice(2);
  if (msisdn.startsWith('0')) msisdn = '228' + msisdn.slice(1);
  if (!msisdn.startsWith('228')) msisdn = '228' + msisdn;
  return msisdn;
}

function detectOperator(msisdn) {
  if (!msisdn || msisdn.length < 5) return null;
  const prefix = msisdn.slice(3, 5);
  if (TOGOCEL_PREFIXES.includes(prefix)) return 'togocel';
  if (MOOV_PREFIXES.includes(prefix)) return 'moov';
  return null;
}

function getRequestPaymentUrl(operator) {
  const base = config.qosic.baseUrl.replace(/\/$/, '');
  return operator === 'moov'
    ? `${base}/QosicBridge/tg/v1/requestpayment`
    : `${base}/QosicBridge/user/requestpayment`;
}

function getStatusUrl() {
  return `${config.qosic.baseUrl.replace(/\/$/, '')}/QosicBridge/user/gettransactionstatus`;
}

async function requestPayment(msisdn, amount, transref, operator) {
  if (!isConfigured()) {
    return { responsecode: '01', responsemsg: 'SIMULATED', transref, serviceref: 'SIMULATED' };
  }
  const res = await axios.post(
    getRequestPaymentUrl(operator),
    {
      msisdn,
      amount: String(amount),
      transref,
      clientid: config.qosic.clientId,
    },
    { auth: { username: config.qosic.username, password: config.qosic.password } }
  );
  return res.data;
}

async function getTransactionStatus(transref) {
  if (!isConfigured()) {
    return { responsecode: '00', responsemsg: 'SUCCESSFUL', transref, comment: 'SIMULATED' };
  }
  const res = await axios.post(
    getStatusUrl(),
    { transref, clientid: config.qosic.clientId },
    { auth: { username: config.qosic.username, password: config.qosic.password } }
  );
  return res.data;
}

module.exports = { normalizeMsisdn, detectOperator, requestPayment, getTransactionStatus, isConfigured };
