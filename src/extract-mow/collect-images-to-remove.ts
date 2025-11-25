import { query } from 'mu';
import { writeCascadingMigrationsForResource } from '../write-cascading-delete-migrations';
import { fileDataObject, image } from './icon-cascade';

export async function collectImagesToRemove() {
  const imgIds = await findImagesToRemove();
  for (const imgId of imgIds) {
    await writeCascadingMigrationsForResource({
      uuid: imgId.uuid,
      rootUri: imgId.uri,
      rootConfig: image()(undefined),
      allConfigs: [image, fileDataObject].map((f) => f()(undefined)),
      filenameInfix: 'prod-image',
      deleteOrInsert: 'DELETE',
      graphFilter: ['http://mu.semte.ch/graphs/mow/registry'],
    });
  }
}

/**
 * Finds images in PROD which are attached to signs that have an image in QA
 */
export async function findImagesToRemove() {
  const queryStr = `

PREFIX mobiliteit: <https://data.vlaanderen.be/ns/mobiliteit#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
SELECT ?uri ?uuid WHERE {

  VALUES ?sign {
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/ad6a486a0290a55f43963593ec16976dc028cc9fa76b1a294c3e729ae00f8740>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/ad6a486a0290a55f43963593ec16976dc028cc9fa76b1a294c3e729ae00f8740>
    <http://data.lblod.info/traffic-sign-concepts/618ECBDE7BD6C80008000004>
    <http://data.lblod.info/traffic-sign-concepts/618ECD027BD6C80008000005>
    <http://data.lblod.info/traffic-sign-concepts/618ECD027BD6C80008000005>
    <http://data.lblod.info/traffic-sign-concepts/618ED57D7BD6C8000800000A>
    <http://data.lblod.info/traffic-sign-concepts/618EDAF37BD6C8000800000C>
    <http://data.lblod.info/traffic-sign-concepts/618EDAF37BD6C8000800000C>
    <http://data.lblod.info/verkeersbordconcepten/61324B0BCC7A640008000005>
    <http://data.lblod.info/verkeersbordconcepten/61324B0BCC7A640008000005>
    <http://data.lblod.info/verkeersbordconcepten/6167DBE6A40DDE0009000002>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/00939dd22288b0ef321908552d49f97c6e77e53de6e14b303f32c9a499839557>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/00c62afceb8661521659394983ff910b2b9cecd92b11ae0376bdb94b9d8c594c>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/00ec95d849486cfd9c41ba02e2125ac2f719f6bb85d26ae78f6cbd006ffd1f42>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/00ec95d849486cfd9c41ba02e2125ac2f719f6bb85d26ae78f6cbd006ffd1f42>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/02ee9abc37a79c9b74cab7eb93cc00c69aeeacac3fb2f6c34733a34c5ab94e9a>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/02ee9abc37a79c9b74cab7eb93cc00c69aeeacac3fb2f6c34733a34c5ab94e9a>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/0354a9248d379808250847432a584e4dc2be39d0eaec787dff319a30e407e053>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/0527c3b6261a500eade105ef371d355c2b950fcdd14302bdfc6711da2933f33a>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/061d2edb3caf482931ee7cea26f85d49538a5d4d0781872c0faad20328650beb>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/09861a82322efebc4fee09562b36f1a51f70b59d930ed9df4146eef10731398b>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/0b8edba107bc181f01ea9fcf241c76f6befff04e15a697acf1c6cdeb49e71868>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/0b8edba107bc181f01ea9fcf241c76f6befff04e15a697acf1c6cdeb49e71868>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/0c471075e7f9f4f6b5c12abf3ed2acb4b1c2dd17545671ae2359ac2e9d524647>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/0c4c0e3561334e2bc50bca4979294fa85607520fa2a22bf25e4b32d350d924ae>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/0c4c0e3561334e2bc50bca4979294fa85607520fa2a22bf25e4b32d350d924ae>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/1027d42a7b5eaa16b31d3da9c8c4ae75fd1100a2e26119037070373bc9709edc>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/10e42121244614faee3f458e4b74c2b84bc54ecf6a79583e81de8420aba2f147>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/10e42121244614faee3f458e4b74c2b84bc54ecf6a79583e81de8420aba2f147>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/11a00892550b4d76a4021b11c9769d4d8812e80a42808da341d72e49f81c5a0c>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/11a00892550b4d76a4021b11c9769d4d8812e80a42808da341d72e49f81c5a0c>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/11a07b567d603a2f01a987ce4feea54c709a57449554debc5f5ae63c602c722b>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/11a07b567d603a2f01a987ce4feea54c709a57449554debc5f5ae63c602c722b>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/11d86f16056832a3cf2765f8de597aadf50d6699c4422afa408f34642c44b42c>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/11d86f16056832a3cf2765f8de597aadf50d6699c4422afa408f34642c44b42c>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/137112aad6b994f965bfd6ceb7e88bf0162db8ac885e57439ef8cbee363fe579>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/137112aad6b994f965bfd6ceb7e88bf0162db8ac885e57439ef8cbee363fe579>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/13e1ea2149022c8b94bf4668ba2161fe61e8ea0154025218c48fd066a4031961>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/13e1ea2149022c8b94bf4668ba2161fe61e8ea0154025218c48fd066a4031961>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/192093668d3375c2ad9b37d8c2d93fa7d91f165e53b653edeccb5a96194561dd>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/1a87027d46dd7d4a3cd3084db904dfe5d22e0cb0ae7dcc47ebed18eec7e52f81>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/1a87027d46dd7d4a3cd3084db904dfe5d22e0cb0ae7dcc47ebed18eec7e52f81>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/1b0064d6a66dc26109c3173acb5254c81e508aa875ff16764b6d45cb34ef651a>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/1c6110b80aad28134ee6cc79cf506a65a0488d1c649841e152ffbdb5031bb5ee>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/20676d464152d3260196bba606060cb7e4b4fea1fa67b3b5b2006cc014bc0c8e>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/20676d464152d3260196bba606060cb7e4b4fea1fa67b3b5b2006cc014bc0c8e>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/21757765d69e1a9d79127575e697648a02d4fc144d41276a138bbb2f07623c47>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/21757765d69e1a9d79127575e697648a02d4fc144d41276a138bbb2f07623c47>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/22e5942e1f2f0e0e4162ec69933e317ede9c3c10200980665a682d30f19034e4>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/22e5942e1f2f0e0e4162ec69933e317ede9c3c10200980665a682d30f19034e4>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/25a693b6497cc1c6bd53f85f018fceb52641719bb1f06cbb6a67517f9fe11b1d>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/25a693b6497cc1c6bd53f85f018fceb52641719bb1f06cbb6a67517f9fe11b1d>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/25edd560e9c1080dcc8275422f857a2b08c7f4efcfb9bb93eb4bf53b9719ead5>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/25edd560e9c1080dcc8275422f857a2b08c7f4efcfb9bb93eb4bf53b9719ead5>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/2721df3072ab4e96f50b345524806082f37252e7a1a802b14d640c3cfd7a1d49>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/2b08f73a820e4998ba2df0155922f480f1f13a286f34949dad8af8914d4f77cd>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/2b08f73a820e4998ba2df0155922f480f1f13a286f34949dad8af8914d4f77cd>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/2d4a6e35cc3d44c3f23f861296516298e5308815da4483543775a72c3444c977>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/2d4a6e35cc3d44c3f23f861296516298e5308815da4483543775a72c3444c977>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/2e6a08b452101a179fdb003a253ea427979430961b52e180f682b510f9f2daa2>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/2ef0f718f6780fa8f69d02d8c3e8ad3cc9879e1a125b361b627a883198b41400>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/2ef0f718f6780fa8f69d02d8c3e8ad3cc9879e1a125b361b627a883198b41400>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/2f862c9704d9e258ecac5245b185270180bfd83f791021abbb93d55c60a72cb3>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/31bdd8a00cbe10bbe2908760820ca07226cb9bfd829e84e87b859d21d4bf6da5>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/32a6431ad5ad20c5bc5eca29bcbbe0ce6bca180ac0a7fceed6e05127e60c16f0>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/32a6431ad5ad20c5bc5eca29bcbbe0ce6bca180ac0a7fceed6e05127e60c16f0>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/32ecdf2825fc33b6f97ccee36b5076ba429ee33ace3c123dd0fbec16aae975d8>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/332f5e44542833f7c5723fc1c55d20b56a7bc79da379613d8f3c48c65276184d>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/33f67bdab2ee149144735719bd2f8b69374c665af7e6b49efc9484fe1a37d842>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/342d51819b4cb121e9071ff244bbf55a153c371792dc5b8d5773890525c7516d>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/3536ac197567d5c95e40959ec4f822bc54c2726e405cea617bffa2117d80b9c8>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/3536ac197567d5c95e40959ec4f822bc54c2726e405cea617bffa2117d80b9c8>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/361c936975bc1f56b7b6b3689c20ad9357ba6d0e0e97dad0bd718c395f4ba9e1>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/361c936975bc1f56b7b6b3689c20ad9357ba6d0e0e97dad0bd718c395f4ba9e1>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/367e8886caac739058332e5f9087d4412a15fafeed0ac1d270c71643a7dd727a>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/36e7f05884aeb3cfe0ed5064713ca63ce7d9817dd14921eae9bd221766153216>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/36e7f05884aeb3cfe0ed5064713ca63ce7d9817dd14921eae9bd221766153216>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/3ab5a7784511d3c2b96b8d4a51d2b69bc0221e625d1f954f0ad7b0036e980cb9>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/42c98b00feb78b15d8c225f8f018a703480d224d7cf48dcb4dc9f6edefc24a6e>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/439b3909b6eae9c6a87120b407e1bdcc0245cda415266347b1f4b930f3573535>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/44354ebf53e7112f55f992b3290d810f5291438b536af1f3ca8e5c630e25c75d>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/44354ebf53e7112f55f992b3290d810f5291438b536af1f3ca8e5c630e25c75d>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/451d20f38b98efda6f0fa73fb26cccda41070b772e3c4fcc46caee62e004ea08>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/451d20f38b98efda6f0fa73fb26cccda41070b772e3c4fcc46caee62e004ea08>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/4666c7f416e910d3b442c51c1c32bbe3ce9ad324c2f07badfad9610431bf1484>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/4666c7f416e910d3b442c51c1c32bbe3ce9ad324c2f07badfad9610431bf1484>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/467fd28bb6c20b60929465203bbfd0d9f76a94d43d9f41574871a594ef6b3846>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/47b523a23f2f2f578d171d5d78d343d01f9b215858733370177c5aab37baa29c>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/47b523a23f2f2f578d171d5d78d343d01f9b215858733370177c5aab37baa29c>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/47c9ffa15a0316eb8144e48eed44bef295c2ea742b37ab6675268611cbbb5b64>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/47c9ffa15a0316eb8144e48eed44bef295c2ea742b37ab6675268611cbbb5b64>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/492b1a013cb0ef68ac92d13765a85db932af9197bc4b54de570e8f3840be9df4>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/492b1a013cb0ef68ac92d13765a85db932af9197bc4b54de570e8f3840be9df4>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/4a03dff5c229e10fbe2544c11236dfce5ab592d70626a0a0671ee23c16585fa6>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/4a03dff5c229e10fbe2544c11236dfce5ab592d70626a0a0671ee23c16585fa6>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/4a2ec210cf9459059de87c11a70b40d957edeb78f302963e1a526a47406d11ec>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/4a2ec210cf9459059de87c11a70b40d957edeb78f302963e1a526a47406d11ec>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/4aab258f2269849dfae22e9bd2eed707d5000596a243e4b0c2d2aff3eb87c300>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/4b73739e98275b80264431306def82137b81e5ca6020fd16ac31ee736dd8f766>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/4b73739e98275b80264431306def82137b81e5ca6020fd16ac31ee736dd8f766>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/4bab5d3b6d4cdfa0d66dcc14ee7107275e2e71e14aa7940e51bc3e94d804c993>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/4bab5d3b6d4cdfa0d66dcc14ee7107275e2e71e14aa7940e51bc3e94d804c993>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/4cdd5c7ae7f47341ae64e5a6f0d87ef4af6a73fc3cd2ba5b1a46cd0fa9c83465>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/4cdd5c7ae7f47341ae64e5a6f0d87ef4af6a73fc3cd2ba5b1a46cd0fa9c83465>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/4f857c0f9709924a47488596aee4387e2729c35b5dd512c5492a9b78715bd326>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/4f857c0f9709924a47488596aee4387e2729c35b5dd512c5492a9b78715bd326>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/500d6d21fd7e19a7e3827a1c4c2ed2c459df6b38f570962b6de1168ac7be4768>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/527b2109b1aacf1a69f31cdae3721302a51a118469ac337c85aba921fa0dca13>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/527b2109b1aacf1a69f31cdae3721302a51a118469ac337c85aba921fa0dca13>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/538c99f7923838b697983a850a957fce6013d760e3a55b55b54bd5e212d40a61>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/538c99f7923838b697983a850a957fce6013d760e3a55b55b54bd5e212d40a61>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/54047e29ccc04a916773bfca49532da57a6cbb2d13cca7c0dd6b676b84e75576>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/5446d50a99626e166d9c93fa1a1be0a5be5cb038388d837a5efdc316a441c5c0>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/5446d50a99626e166d9c93fa1a1be0a5be5cb038388d837a5efdc316a441c5c0>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/547a8f06c0039902f75a68c763d9e66605fe8e78b96375964a0c3765d6f71203>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/547a8f06c0039902f75a68c763d9e66605fe8e78b96375964a0c3765d6f71203>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/54ad701e9011dca3be225508dde2a32a71ba17f7ca88e404a61b152dab402461>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/55162fd0c4ace95126afa15608016924b948ff4f6a955a6cb908d0c46262737c>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/55162fd0c4ace95126afa15608016924b948ff4f6a955a6cb908d0c46262737c>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/553eb02c10145ea8fe7f2fc09a66a48da4820fa012c9697d49b16acc7df3a041>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/57fdbb852e7bdcb6450e61b8d6b837930a26881c6709e2e456c3544d5cb465c9>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/599f34b8118a89d905d6e43944f22489fe770131e8d492bb92e62053afa13016>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/599f34b8118a89d905d6e43944f22489fe770131e8d492bb92e62053afa13016>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/5a99bb07ee0886bcbc996b67327b2977bc70e67ad9ee9649d7e24f44f68b4684>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/5a99bb07ee0886bcbc996b67327b2977bc70e67ad9ee9649d7e24f44f68b4684>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/5d898e118d9f413d489cefe38a675ecab0c3a1a554475275b32fdb1e7f3a25da>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/5d898e118d9f413d489cefe38a675ecab0c3a1a554475275b32fdb1e7f3a25da>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/600b30431b96653057da8e807aa49c299ea450433b59291ba1e2442656d309ab>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/62322bcd7dbc57bff8219bd973ea664671c3788c7444be7bd6e2b8a773f4308b>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/62322bcd7dbc57bff8219bd973ea664671c3788c7444be7bd6e2b8a773f4308b>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/62da21c7e453f5de930d244fbcf47580bd1f1b1773faf0c4c15a81a8f2cc3879>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/63eca6e1d18ff9e92f71db5b637c0763e87b2d97fbdd6b1eb58e11a3514f8d8f>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/64d0148e08734e74f31a183130ab616a3fdb25ab8bd1c60a9cbb6b918908b244>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/6863e3797bc06c1ef11a793e4462a32ccfc45d31642213209c15f87339a279f5>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/6863e3797bc06c1ef11a793e4462a32ccfc45d31642213209c15f87339a279f5>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/69789f034ab0b39016cd2d17ac594edf1aaf3f5b7e167fb85025483c2bd63bf2>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/69789f034ab0b39016cd2d17ac594edf1aaf3f5b7e167fb85025483c2bd63bf2>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/6b9d9a56cad922f1f99e67ff6b775a49acd896a04c8cdb1d69faab0255ef3260>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/6bf808b4f6ff1a24e5646ab44302ae87252ec04dc0ffc5f49d14253b2e4c4c6c>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/6bf808b4f6ff1a24e5646ab44302ae87252ec04dc0ffc5f49d14253b2e4c4c6c>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/6cebe8cd9a145b9791d607b6b66fee19a080ab8efecdca98bef9dde1d7a3c228>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/6cebe8cd9a145b9791d607b6b66fee19a080ab8efecdca98bef9dde1d7a3c228>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/6d0c27ab98b20311e8a9ca5eb570d9ad005e7f6c92abdd46a4b99789124299bf>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/6ff25f28ed1b550860a007d3fbd8590b1839dd86adbc87b578dd57aa572e427d>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/6ff25f28ed1b550860a007d3fbd8590b1839dd86adbc87b578dd57aa572e427d>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/73038f34804b2c4b5552eadd2cb7c8c677f7e7386e48286ac75873cb030fd617>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/73038f34804b2c4b5552eadd2cb7c8c677f7e7386e48286ac75873cb030fd617>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/734eff1afee00937cb46123d801e75ac98a1d26e186d8f2386cc6df45e31d324>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/735cd32e48f1535d2c9a1dc572e8e03a3d5907b7402675f901672d6c28d1a341>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/73b92a883ff7418db03e46e5b052d14a3e7e9c5ad12d643a6660fcb11160d9da>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/780a355dca03588365bd17c52308b8ffc4348db47d678d418462a2b01482b349>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/79b74b6bfaa129c36bdd8fc39a0e071a15e6be38a4ec37bc0c34206fcc6a8d55>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/79b74b6bfaa129c36bdd8fc39a0e071a15e6be38a4ec37bc0c34206fcc6a8d55>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/79d0bab2f07f815d457412b68edab1ba70ee15764d5fcbb531fa87ce24574da6>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/7b796f77edc7d487881bd4fbc5faebda6d803ff899740de440211257d706c136>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/7b796f77edc7d487881bd4fbc5faebda6d803ff899740de440211257d706c136>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/7d6a7b43528f9c71a42780a01dd1e43e1db1e2675c4f3e18effe6939bbc663ee>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/7da45b71ecfe8253f0cb56c27522c8372376ef6fdd3506e7e94ab4fdd7dd2e36>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/7da45b71ecfe8253f0cb56c27522c8372376ef6fdd3506e7e94ab4fdd7dd2e36>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/81dacb65d15dc41b3f92ffeb9b6d8a776180c1261b69d74db5783bcdb3d3e79f>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/81dacb65d15dc41b3f92ffeb9b6d8a776180c1261b69d74db5783bcdb3d3e79f>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/838ee6f9581cc3356ca509419cbeec9195dbb5e6d5aaf5e1f3fd16315a45d5e3>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/84567323c818fdb559cc3df4dbc141d3e24efcf6f528473c5c0ec20e180e56e2>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/87633686f31916bfc50b2225ce37ec54affbc79f79e9eea1e4a5cf64740697f4>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/8780c6ff79d2880d39cbcddb3ed380dd006dcecfedb661a2891dc5f45c09b876>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/8780c6ff79d2880d39cbcddb3ed380dd006dcecfedb661a2891dc5f45c09b876>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/87812202afe8a44d0a9fed57a3210338651f31fca8d666dbeda867dadced3ea4>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/879cbc04eb6fbbffdfcd88eaa139e13eac46bc673eb733f16612e02fed94ea11>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/879cbc04eb6fbbffdfcd88eaa139e13eac46bc673eb733f16612e02fed94ea11>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/8eea1ddf2b9b0a77c5045b557b58076973bca0e74be65ff2f4345a9a8f817a1d>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/8eea1ddf2b9b0a77c5045b557b58076973bca0e74be65ff2f4345a9a8f817a1d>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/8f944b59e51667751b676806d537c79e3be7e38545f1e276fe5db1b5081ef5fc>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/92221b27491e15c4a76e505ed093e03da7f934f98c4befe5be99af71601615c5>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/92be90daa71f882c22281e67a3521120343b84e67214acf4156f6ef71132b79c>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/9375ac24955c89adb412e5bb7e3c4f56d0ebde1022963bf84e52affd987715e3>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/950eeeaa70a8d7b9c29056a248fa0e673881f37a10fdce925e969828af827272>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/950eeeaa70a8d7b9c29056a248fa0e673881f37a10fdce925e969828af827272>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/954557c970fea1888c7cd5fd11d1a1fd582517da4a05a02fc34599eb36853a76>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/954557c970fea1888c7cd5fd11d1a1fd582517da4a05a02fc34599eb36853a76>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/955ad6f4bcf6b031cbf9932796d04f346c661c96e4fadb8db28e035ac9583a3a>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/955ad6f4bcf6b031cbf9932796d04f346c661c96e4fadb8db28e035ac9583a3a>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/9606024f199e0c7ed18cbcd1e0cf10e4628fcd80760af8a47e876ce9773eb593>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/960fda0353243b3df9cd3b6cb43802d14500c1317b3aa320e63e247f3388c205>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/960fda0353243b3df9cd3b6cb43802d14500c1317b3aa320e63e247f3388c205>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/9a99ae7486d2f485d6540fb82b5c12d732788b46dcc66a2a5fcd0966929c6a43>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/9a99ae7486d2f485d6540fb82b5c12d732788b46dcc66a2a5fcd0966929c6a43>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/9cbedafef411f1c41317f8b9f4066ea6eccfc832edfc930d421725c3ebc5c167>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/9f44a10f221152c659d9485e0ad976c7950844d23a3ac4896ea520bd87b868ff>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/a03dc4c14ea95352be3a61e999b541bf18b13f979a0a8fe127feee53b4fae490>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/a03dc4c14ea95352be3a61e999b541bf18b13f979a0a8fe127feee53b4fae490>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/a044fe2e77e31276281d1e915f9cfbd97cc4bfc7505087987a13d9b27f2a1ca4>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/a044fe2e77e31276281d1e915f9cfbd97cc4bfc7505087987a13d9b27f2a1ca4>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/a12dc2565be0dd45f62af20493a2dbc17d83b544db425a804bdbe56f6d99b8cd>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/a12dc2565be0dd45f62af20493a2dbc17d83b544db425a804bdbe56f6d99b8cd>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/a14b8cd76fbf8e965f47adc3644eec7c9aaeb64927c755a6fb67de6d63a236ef>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/a14b8cd76fbf8e965f47adc3644eec7c9aaeb64927c755a6fb67de6d63a236ef>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/a5124762c35c1d71e97bc164c78ed9e82ce7b2fd1967ebb7f6882633fc9faba9>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/adf551bbe4b45fb09fe65bbd515889acb611157d02385990ea44406c29376eef>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/adf551bbe4b45fb09fe65bbd515889acb611157d02385990ea44406c29376eef>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/aee7ac92ad6686f4734d30b0a257d174bc3543562c4afdfb6e8dbc600da44fbd>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/aee7ac92ad6686f4734d30b0a257d174bc3543562c4afdfb6e8dbc600da44fbd>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/b01d15be48cc1bd95ada28cae1c18e37e64fbb723a83950eb6f9b1126b63c692>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/b0b50921fd34b0b2d4b4a8c72dbb7872071dc3b15a492ac77683707d308feae1>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/b0b50921fd34b0b2d4b4a8c72dbb7872071dc3b15a492ac77683707d308feae1>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/b177403ff3ec65e0de763fd5d54110e4b57d0665b84eeb89ab2d6e7268bc37c1>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/b220de78deaf7595b84fe86a8dc2b881009b6ea15428a0e2e7c4b679c61c29e5>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/b220de78deaf7595b84fe86a8dc2b881009b6ea15428a0e2e7c4b679c61c29e5>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/b4ce49f90460d0ed702ae714771dda6504e1e85b17eb7e89ec6fe00dfa444fbc>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/b4ce49f90460d0ed702ae714771dda6504e1e85b17eb7e89ec6fe00dfa444fbc>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/b56e3eab86de7c8c4d75b9b82778951d3c857b3249e2121297178910516d26c2>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/b56e3eab86de7c8c4d75b9b82778951d3c857b3249e2121297178910516d26c2>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/b5e9f13d81ac78f0002aac342f4eb866394598088cfe0276013b928afd1560f8>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/b5e9f13d81ac78f0002aac342f4eb866394598088cfe0276013b928afd1560f8>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/b667a243b8ec32abc8cae6ff5cdff6dafb667cf1ddec6ff015824b451895d4d2>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/b667a243b8ec32abc8cae6ff5cdff6dafb667cf1ddec6ff015824b451895d4d2>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/b66e9e8ac16b07d9311e94a44dd7146b8e6ada618f414e8502eac53422c8b842>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/b66e9e8ac16b07d9311e94a44dd7146b8e6ada618f414e8502eac53422c8b842>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/b6f496913382bd6183372a0b966f19e71230d65e2294e4d0c717c1f87dbac0d9>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/bacd3126b707b98ab097f8744a9f1333ff393413bc174912b133b31117fc69a8>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/bc05e44f54e530335872114a61a3959f423b0f369f464e3717495b14d8ffd1ca>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/bc05e44f54e530335872114a61a3959f423b0f369f464e3717495b14d8ffd1ca>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/bc312fc26af5cf71e7616e1d9fd0e3a34f8c44b0d97dfa8ab8a532d1faac3b87>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/bc67b2aed58af8cba5f38d177bfc2525b97410a84dec019d0a54a072bae6c776>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/bc67b2aed58af8cba5f38d177bfc2525b97410a84dec019d0a54a072bae6c776>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/bd68717b59b32f5cfc66e459f72f7fef6ff8bc33d9276dcc2ca7c8ca7e860371>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/bd68717b59b32f5cfc66e459f72f7fef6ff8bc33d9276dcc2ca7c8ca7e860371>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/be92d225a5de7d82b9021b75dd48c7bdaf91a7b6243215ba7c03160817ee9476>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/bedd100cbf5d1795b9f4a9cf5d63846a65e0d5deb7f1122848e826f5b9e221af>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/bedd100cbf5d1795b9f4a9cf5d63846a65e0d5deb7f1122848e826f5b9e221af>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/c013a71f9cd0f6084cd5beac514f11edb27aeb99cb9ed375150567c71db3b061>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/c013a71f9cd0f6084cd5beac514f11edb27aeb99cb9ed375150567c71db3b061>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/c325e2c889471d83f36a825b68a0801de16c2a4ba7e36a4c897f6c3493125dcf>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/c325e2c889471d83f36a825b68a0801de16c2a4ba7e36a4c897f6c3493125dcf>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/c362573ba2407ca71b0f5169a2e9ddda47a2284c58564bcb36ba40e9efb634c7>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/c79e5d6420236e345184ff40f4aeebd7764f2281b1945fbd365bfde141181c1b>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/c8f5ec1e8e07096c736c24f09a5c02783d799d0956d281369a098629e3bab228>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/cbf8a964bc0e877ae0eb9574f982b5b0d9d5112d4a1673aed3e10b9250c27a77>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/ccfce8f5c49bf6098900d566a57a37a34c152a713eded5f0e89d5badfac2a77f>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/ce4b8d325e769ba3239378723a3d04af417ca4b8b1c76fcc18af1fd70448ebdc>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/ce89d1a5cdd2078c5ae18dfacba050fe2e2db116c57f2e9934a5ce6eddf2e893>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/ce89d1a5cdd2078c5ae18dfacba050fe2e2db116c57f2e9934a5ce6eddf2e893>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/cf6a4d6032ccd48355e7530a0d95e32c31064a00848bc8fcfd06245cfcb412ee>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/cf6a4d6032ccd48355e7530a0d95e32c31064a00848bc8fcfd06245cfcb412ee>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/d2eaca5fcc21522d4f1732550bc78e8b6a935e974c6350896ee59ed2c92fbf42>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/d2eaca5fcc21522d4f1732550bc78e8b6a935e974c6350896ee59ed2c92fbf42>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/d56eb7958bd50f75219369a1d063eb26035353e8e462b6dc7adf704971482dd5>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/d56eb7958bd50f75219369a1d063eb26035353e8e462b6dc7adf704971482dd5>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/d6994e5d8b2cfedffaad046aa1a0701e892b2f4feb901fadbf7814f678ae5663>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/d6994e5d8b2cfedffaad046aa1a0701e892b2f4feb901fadbf7814f678ae5663>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/d6fa3d560d0655cd0db5644293a44357f235b1932cfd1b64ea6dd122326bd24b>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/dad194b644e9e2727a0b0e166a28b9e06421f76f583bbae849c60b950c9be056>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/dd9fbcc750edb4f6cb439a5a014120c34c77c5cab6aaf91320ad53c3c748819f>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/dfa07fdaeb6870f1e2922ba694f0fbf5b929f2f9249b785d7c0591b0201ba4c8>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/dfa07fdaeb6870f1e2922ba694f0fbf5b929f2f9249b785d7c0591b0201ba4c8>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/e076d4553d8995d0739ad74dc30dbb5cf4095b6c0a9e9a68503e7a7da03f3b9e>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/e3d7c392305c0e69ab2d9cef4e5686bf220e3e22afe4672865084a2b2ff6a76a>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/e3d7c392305c0e69ab2d9cef4e5686bf220e3e22afe4672865084a2b2ff6a76a>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/e43ce5f4a2de5600887d52d0c83d16bbddac2d51264d501d33113c370f215ec4>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/e53601fbc656ad3806a470dc7c4a57579d169b52b1197a85f239373c2b5e92e1>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/e6f178e53fc9ae0d1d17616ef08d3873f6892bfc46acf1f8850a77d34d4f85d2>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/e6f178e53fc9ae0d1d17616ef08d3873f6892bfc46acf1f8850a77d34d4f85d2>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/e8464868874fc0b87cad2fd84ecd58b1983561668765591ea58187afb5d39cd4>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/e8464868874fc0b87cad2fd84ecd58b1983561668765591ea58187afb5d39cd4>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/e84d5732cf1299f012da33d3f8d76b0dfb7213ae86f0ed0fe76044f7f900424f>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/e8cdf86215d2202a9001f93e1ed3b7577885fe972a799a30f29998bf0fb34e02>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/e8cdf86215d2202a9001f93e1ed3b7577885fe972a799a30f29998bf0fb34e02>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/e9749354c481b5ab2cb2281988979eadb226942b34f54699d0fb0ecffa9b3f39>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/e9749354c481b5ab2cb2281988979eadb226942b34f54699d0fb0ecffa9b3f39>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/eadf7c2db13f747a7241c4689a212e02f4c93f6957844fa4ff26fdf2ce6165bc>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/eadf7c2db13f747a7241c4689a212e02f4c93f6957844fa4ff26fdf2ce6165bc>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/ec0dd82c6870eef371bcd7e3bb57707aab6f3533f94cdefbe1dc079edbc4c8a9>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/ec0dd82c6870eef371bcd7e3bb57707aab6f3533f94cdefbe1dc079edbc4c8a9>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/ecedfa0ac528d4ba21050a5ff32e8f320fb7f1da82c799c29b1fa85fcf0a9024>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/ef95e7f29f423cb55cfb085749607778bfaf770137e9b0cfc3362f374094985f>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/efc00f794b4d66ddd9c1f8fee1f45e580c37052bc9607af89b09d5e665797eb2>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/f2d4482b8dfe27b35c630f209112ce2d0741378c51981789dafb760c115b04de>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/f304fa07025853d008cb86709fea2a4c19894ce5031f41b04076e3039bce466a>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/f46c41dce095d2e07a36a8e764c22834eebcc9283c48c36171e3a4ee483ca5ba>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/f4798e844b2bd16c4cf25d4a4c2290cc6139ab04824d380f2a3fd91fdae8bf2c>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/f4798e844b2bd16c4cf25d4a4c2290cc6139ab04824d380f2a3fd91fdae8bf2c>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/f74b9e8e4ddd1760f32d54063f96a3964846464bed031a942863f59f5187a268>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/f74b9e8e4ddd1760f32d54063f96a3964846464bed031a942863f59f5187a268>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/f9312556b1bdfbb278ec04033417152abbb254466df0069ff1894d0ea7a55482>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/fa3de7606ecb2c6ae3c923483a191fb4ffdf33d7f6bfd407f9049b50d48f50e0>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/fa3de7606ecb2c6ae3c923483a191fb4ffdf33d7f6bfd407f9049b50d48f50e0>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/fa4db4e1284d3c686c2c7eb94bfbffb961d7358c980aa099c7ca0c4bfdfac9df>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/fbcc4839ac315ddc5bfb773c90333ae664723214dbc7c64e9e3f81075b2f68aa>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/fcc9d98e971d74253c641355dc88c94ea70f8a8a1a789ea4aef44a0f23a52728>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/fcc9d98e971d74253c641355dc88c94ea70f8a8a1a789ea4aef44a0f23a52728>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/fdfa1e43849e5794251962b8a54c3977e9b37c1bd8b477e69828e0216fc8b6f4>
    <http://data.vlaanderen.be/id/concept/Verkeersbordconcept/fdfa1e43849e5794251962b8a54c3977e9b37c1bd8b477e69828e0216fc8b6f4>
    <http://data.lblod.info/traffic-sign-concepts/61ADE67CBF5C75000900001F>
    <http://data.lblod.info/traffic-sign-concepts/61AE0B68BF5C75000900002E> 
  }

  ?sign a mobiliteit:Verkeersbordconcept.
  ?sign mobiliteit:grafischeWeergave ?uri.
  ?uri a foaf:Image;
       mu:uuid ?uuid.

}`;

  const result = await query<{ uri: string; uuid: string }>(queryStr);
  return result.results.bindings.map((b) => ({
    uri: b.uri.value,
    uuid: b.uuid.value,
  }));
}
