// Updated sample config for AWS Amplify. This file will be overwritten by "amplify push".
const awsmobile = {
  "aws_project_region": "us-east-1",
  "aws_appsync_graphqlEndpoint": "https://example.appsync-api.us-east-1.amazonaws.com/graphql",
  "aws_appsync_region": "us-east-1",
  "aws_appsync_authenticationType": "API_KEY",
  "aws_appsync_apiKey": "EXAMPLE_API_KEY",
  "aws_cognito_identity_pool_id": "us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "aws_cognito_region": "us-east-1",
  "aws_user_pools_id": "us-east-1_xxxxxxx",
  "aws_user_pools_web_client_id": "xxxxxxxxxxxxxxxxxxxxxxxxxx",
  "aws_account_id": "693490816013",  // AWS account number
  "aws_iam_signin_url": "https://693490816013.signin.aws.amazon.com/console",
  // Maximum change: added custom configuration override
  "customConfig": {
      "retryAttempts": 3,
      "timeout": 15000
  }
};

export default awsmobile;
