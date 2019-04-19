import * as firebase from '@firebase/testing';
import * as fs from 'fs';

const projectName = 'firebase-security-sample';
const coverageUrl = `http://localhost:8080/emulator/v1/projects/${projectName}:ruleCoverage.html`;

const rules = fs.readFileSync('firestore.rules', 'utf8');
const permissionDeniedError = { code: 'permission-denied' }

function app(auth) {
  return firebase
    .initializeTestApp({ projectId: projectName, auth })
    .firestore();
}

describe('firestore.rules', () => {
  beforeAll(async () => {
    await firebase.loadFirestoreRules({
      projectId: projectName,
      rules: rules
    })
  })
  beforeEach(async () => {
    await firebase.clearFirestoreData({
      projectId: projectName
    })
  })
  afterAll(async () => {
    await Promise.all(firebase.apps().map(app => app.delete()))
    console.log(`View rule coverage information at ${coverageUrl}\n`)
  })
  describe('認証なし', () => {
    describe('ユーザー情報', () => {
      test('書き込みできないこと', async () => {
        const db = app(null)
        const profile = db.collection('users').doc('alice')
        await expect(profile.set({ birthday: "January 1" })).rejects.toMatchObject(permissionDeniedError)
      })  
    })
  })
  describe('認証あり', () => {
    let authUser: any

    beforeEach(() => {
      authUser = { uid: 'alice' }
    })

    describe('ユーザー情報', () => {
      test('書き込みできること', async () => {
        const db = app(authUser)
        const profile = db.collection('users').doc(authUser.uid)
        const payload = {
          birthday: 'January 1',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }
        await expect(profile.set(payload)).resolves.toBeUndefined()
      })  
    })
  })
})
