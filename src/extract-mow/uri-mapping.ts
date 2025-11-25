/**
 * Signs with the same code which exist in QA and Prod with a different URI
 * The map key is the QA uri, the value is the Prod uri
 */
export const uriMap = new Map<string, string>([
  [
    'http://data.lblod.info/road-sign-concepts/68CBF1E411E4E1224CFC0B48',
    'http://data.lblod.info/traffic-sign-concepts/63B53198867176EC5DDD1135',
  ],
  [
    'http://data.vlaanderen.be/id/concept/Verkeersbordconcept/3037b526b0e73c6764ef1071f2658b5ba74287d2fdb30a4657355dfb621b85fe',
    'http://data.lblod.info/traffic-sign-concepts/63B5543E867176EC5DDD11DB',
  ],
  [
    'http://data.vlaanderen.be/id/concept/Verkeersbordconcept/1c7dc73190d75178b1c27d7ccea4bcaf2dfdefe91f947757550b9358f3541376',
    'http://data.lblod.info/traffic-sign-concepts/61B8A2B2BF5C750009001300',
  ],
  [
    'http://data.lblod.info/road-sign-concepts/67F6829DC63D71734B3C8DB2',
    'http://data.lblod.info/traffic-sign-concepts/6357DC4F867176EC5DDD1113',
  ],
  [
    'http://data.lblod.info/road-sign-concepts/67F682CDC63D71734B3C8DB7',
    'http://data.lblod.info/traffic-sign-concepts/6357DDA9867176EC5DDD1115',
  ],
  [
    'http://data.lblod.info/road-sign-concepts/67F682F9C63D71734B3C8DBC',
    'http://data.lblod.info/traffic-sign-concepts/6357DE94867176EC5DDD1117',
  ],
  [
    'http://data.lblod.info/road-sign-concepts/67F68323C63D71734B3C8DC1',
    'http://data.lblod.info/traffic-sign-concepts/6357DF2D867176EC5DDD1119',
  ],
]);
