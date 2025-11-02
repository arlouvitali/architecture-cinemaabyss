const express = require('express');
const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 8082;

const kafka = new Kafka({
  clientId: 'events-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'events-service-group' });

app.use(express.json());

async function initKafka() {
  try {
    await producer.connect();
    await consumer.connect();

    await consumer.subscribe({ topic: 'movie-events', fromBeginning: true });
    await consumer.subscribe({ topic: 'user-events', fromBeginning: true });
    await consumer.subscribe({ topic: 'payment-events', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const event = JSON.parse(message.value.toString());
        console.log(`Consumed event from ${topic}:`, event);
      },
    });

    console.log('Kafka initialized successfully');
  } catch (error) {
    console.error('Error initializing Kafka:', error);
    // Retry initialization after a delay
    setTimeout(initKafka, 5000);
  }
}

app.get('/api/events/health', (req, res) => {
  res.json({ status: true });
});

app.post('/api/events/movie', async (req, res) => {
  const event = {
    id: uuidv4(),
    type: 'movie',
    timestamp: new Date().toISOString(),
    payload: req.body
  };

  const sendEvent = async () => {
    try {
      await producer.send({
        topic: 'movie-events',
        messages: [{ value: JSON.stringify(event) }],
      });

      console.log('Movie event produced:', event);

      res.status(201).json({
        status: 'success',
        event: event
      });
    } catch (error) {
      console.error('Error producing movie event:', error);
    }
  };

  sendEvent();
});

app.post('/api/events/user', async (req, res) => {
  const event = {
    id: uuidv4(),
    type: 'user',
    timestamp: new Date().toISOString(),
    payload: req.body
  };

  const sendEvent = async () => {
    try {
      await producer.send({
        topic: 'user-events',
        messages: [{ value: JSON.stringify(event) }],
      });

      console.log('User event produced:', event);

      res.status(201).json({
        status: 'success',
        event: event
      });
    } catch (error) {
      console.error('Error producing user event:', error);
    }
  };

  sendEvent();
});

app.post('/api/events/payment', async (req, res) => {
  const event = {
    id: uuidv4(),
    type: 'payment',
    timestamp: new Date().toISOString(),
    payload: req.body
  };

  const sendEvent = async () => {
    try {
      await producer.send({
        topic: 'payment-events',
        messages: [{ value: JSON.stringify(event) }],
      });

      console.log('Payment event produced:', event);

      res.status(201).json({
        status: 'success',
        event: event
      });
    } catch (error) {
      console.error('Error producing payment event:', error);
    }
  };

  sendEvent();
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await producer.disconnect();
  await consumer.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await producer.disconnect();
  await consumer.disconnect();
  process.exit(0);
});

app.listen(PORT, async () => {
  console.log(`Events service listening on port ${PORT}`);
  await initKafka();
});
