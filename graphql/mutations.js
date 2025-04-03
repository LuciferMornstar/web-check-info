export const createScanResult = /* GraphQL */ `
  mutation CreateScanResult($input: CreateScanResultInput!) {
    createScanResult(input: $input) {
      url
      domain
      timestamp
      contactCount
      structuredContacts {
        name
        email
        phone
      }
    }
  }
`;

export const deleteScanResult = /* GraphQL */ `
  mutation DeleteScanResult($input: DeleteScanResultInput!) {
    deleteScanResult(input: $input) {
      url
    }
  }
`;
