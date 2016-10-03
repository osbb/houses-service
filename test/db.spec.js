import chai from 'chai';
import { MongoClient, ObjectId } from 'mongodb';
import * as Houses from '../db';

chai.should();

let db;

before(() => MongoClient.connect('mongodb://localhost:27017/testing')
  .then(conn => {
    db = conn;
  })
);

describe('Houses Service', () => {
  const houses = [
    { _id: new ObjectId() },
    { _id: new ObjectId() },
    { _id: new ObjectId() },
  ];

  before(() => db.collection('houses').insert(houses));

  after(() => db.collection('houses').remove({}));

  it(
    'should load houses from database',
    () => Houses.load(db)
      .then(res => {
        res.should.have.length(3);
      })
  );

  it(
    'should update house in database',
    () => Houses.update(db, Object.assign({}, { _id: houses[0]._id, address: 'test' }))
      .then(res => {
        res.should.have.property('address').equal('test');
      })
  );

  it(
    'should create house in database',
    () => Houses.create(db, Object.assign({}, { address: 'test' }))
      .then(res => {
        res.should.have.property('address').equal('test');
      })
  );
});
