import AWS from 'aws-sdk';

const ssm = new AWS.SSM();
export const getSSMParams = async (Name: string) =>
  ssm
    .getParameter({ Name })
    .promise()
    .then((r) => r.Parameter?.Value);
