import { getRabbitConnection } from './rabbit-connection';
import { getMongoConnection } from './mongo-connection';
import winston from 'winston';
import * as Houses from './db';

function sendResponseToMsg(ch, msg, data) {
  return ch.sendToQueue(
    msg.properties.replyTo,
    new Buffer(JSON.stringify(data)),
    { correlationId: msg.properties.correlationId }
  );
}

Promise
// wait for connection to RabbitMQ and MongoDB
  .all([getRabbitConnection(), getMongoConnection()])
  // create channel rabbit
  .then(([conn, db]) => Promise.all([conn.createChannel(), db]))
  .then(([ch, db]) => {
    // create topic
    ch.assertExchange('events', 'topic', { durable: true });
    // create queue
    ch.assertQueue('houses-service', { durable: true })
      .then(q => {
        // fetch by one message from queue
        ch.prefetch(1);
        // bind queue to topic
        ch.bindQueue(q.queue, 'events', 'houses.*');
        // listen to new messages
        ch.consume(q.queue, msg => {
          let data;

          try {
            // messages always should be JSONs
            data = JSON.parse(msg.content.toString());
          } catch (err) {
            // log error and exit
            winston.error(err, msg.content.toString());
            return;
          }

          // map a routing key with actual logic
          switch (msg.fields.routingKey) {
            case 'houses.load':
              Houses.load(db) // logic call
                .then(houses => sendResponseToMsg(ch, msg, houses)) // send response to queue
                .then(() => ch.ack(msg)); // notify queue message was processed
              break;
            case 'houses.update':
              Houses.update(db, data) // logic call
                .then(house => sendResponseToMsg(ch, msg, house)) // send response to queue
                .then(() => ch.ack(msg)); // notify queue message was processed
              break;
            case 'houses.create':
              Houses.create(db, data) // logic call
                .then(house => sendResponseToMsg(ch, msg, house)) // send response to queue
                .then(() => ch.ack(msg)); // notify queue message was processed
              break;
            case 'houses.delete':
              Houses.remove(db, data) // logic call
                .then(house => sendResponseToMsg(ch, msg, house)) // send response to queue
                .then(() => ch.ack(msg)); // notify queue message was processed
              break;
            default:
              // if we can't process this message, we should send it back to queue
              ch.nack(msg);
              return;
          }
        });
      });
  });
