// ====================================================
// CONTROLLER: BANANA GAME & INTEROPERABILITY
// THEME 2: INTEROPERABILITY (EXTERNAL WEB API)
// ====================================================

// Controller method to fetch puzzle from Marc Conrad's external API
exports.getPuzzle = async (req, res) => {
  try {
    // External REST API URL endpoint for banana puzzle generator
    const apiUrl = 'https://marcconrad.com/uob/banana/api.php?out=json';

    // Interoperate with external service by sending an HTTP GET request
    const response = await fetch(apiUrl);

    // Parse the received JSON response from the remote third-party server
    const data = await response.json();

    // Store correct answer in server session so client cannot inspect or cheat
    req.session.solution = data.solution;

    // Send puzzle image URL to client without exposing the solution
    res.json({ question: data.question });
  } catch (error) {
    // Handle network or parsing errors during interoperability exchange
    res.status(500).json({ error: 'Failed to fetch puzzle from external API' });
  }
};

// Controller method to validate player's guess against session solution
exports.checkAnswer = (req, res) => {
  // Extract player's submitted guess from request body
  const { guess } = req.body;

  // Retrieve correct solution previously saved in session
  const solution = req.session.solution;

  // Compare parsed integer guess against stored solution
  if (parseInt(guess, 10) === solution) {
    // Respond that answer is correct
    return res.json({ correct: true, message: 'Correct! Well done!' });
  }

  // Respond that answer is incorrect and reveal answer
  return res.json({ correct: false, message: `Incorrect! The correct answer was ${solution}` });
};
