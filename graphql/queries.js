export const listScanResults = /* GraphQL */ `
  query ListScanResults {
    listScanResults {
      items {
        url
        domain
        timestamp
        contactCount
        emailCount
        phoneCount
        structuredContacts {
          name
          email
          phone
        }
      }
    }
  }
`;

export const getScanResult = /* GraphQL */ `
  query GetScanResult($url: String!) {
    getScanResult(url: $url) {
      url
      domain
      timestamp
      contactCount
      emailCount
      phoneCount
      structuredContacts {
        name
        email
        phone
      }
    }
  }
`;
