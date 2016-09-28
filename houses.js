import { ObjectId } from 'mongodb';

export function load(db) {
  return db.collection('houses').find({}).toArray();
}

export function update(db, house) {
  const { title, answer } = house;

  return db.collection('houses')
    .updateOne({ _id: ObjectId(house._id) }, { $set: { title, answer } })
    .then(() => db.collection('houses').findOne({ _id: ObjectId(house._id) }, {}));
}

export function create(db, house) {
  const { title, answer } = house;

  return db.collection('houses')
    .insertOne({ title, answer }, {})
    .then(res => db.collection('houses').findOne({ _id: ObjectId(res.insertedId) }, {}));
}
