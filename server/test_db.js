const mongoose = require('mongoose');

const uri = "mongodb://rajeshwargoud9898_db_user:Pinkyrajeshwar75@ac-oeqeipr-shard-00-00.c7pjjcg.mongodb.net:27017,ac-oeqeipr-shard-00-01.c7pjjcg.mongodb.net:27017,ac-oeqeipr-shard-00-02.c7pjjcg.mongodb.net:27017/grievance_db?ssl=true&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(uri)
  .then(() => {
    console.log("Connected successfully to Atlas!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection failed:", err.message);
    process.exit(1);
  });
