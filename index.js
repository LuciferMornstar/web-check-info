import Amplify from 'aws-amplify';
import awsExports from './aws-exports';
Amplify.configure(awsExports);

console.log("Web Check app initialized");