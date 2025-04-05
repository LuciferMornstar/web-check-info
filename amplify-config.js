import Amplify from 'aws-amplify';
import awsExports from './aws-exports';

export const configureAmplify = () => {
  try {
    Amplify.configure(awsExports);
    console.log('Amplify configured successfully');
  } catch (error) {
    console.error('Error configuring Amplify:', error);
  }
};
