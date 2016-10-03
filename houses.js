import { ObjectId } from 'mongodb';

export function load(db) {
  return db.collection('houses').find({}).toArray();
}

export function update(db, house) {
  return db.collection('houses')
    .updateOne({ _id: ObjectId(house._id) }, { $set: house })
    .then(() => db.collection('houses').findOne({ _id: ObjectId(house._id) }, {}));
}

export function create(db, house) {
  return db.collection('houses')
    .insertOne(house, {})
    .then(res => db.collection('houses').findOne({ _id: ObjectId(res.insertedId) }, {}));
}
