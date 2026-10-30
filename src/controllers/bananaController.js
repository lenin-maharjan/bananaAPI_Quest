// ====================================================
// CONTROLLER: BANANA GAME & FAULT-TOLERANT INTEROPERABILITY
// THEME 2: INTEROPERABILITY (EXTERNAL REST API CONSUMPTION)
// THEME 2: FAULT TOLERANCE & GRACEFUL DEGRADATION
// ====================================================

// Hardcoded fallback puzzle cache to ensure High Availability when remote API is down
const FALLBACK_PUZZLE = {
  // Pre-cached puzzle question image URL guaranteed to render in browser
  question: 'https://www.sanfoh.com/uob/banana/data/t58beac222e7adb19012264c235n78.png',
  // Solution value associated with the pre-cached fallback puzzle
  solution: 5
};

// Controller method to fetch puzzle from Marc Conrad's external API with fallback resilience
exports.getPuzzle = async (req, res) => {
  try {
    // External REST API endpoint URL provided by Marc Conrad
    const apiUrl = 'https://marcconrad.com/uob/banana/api.php?out=json';

    // Interoperate with external service with a 5000ms (5 second) network timeout guard
    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) });

    // Validate if HTTP response status indicates success (status code 200-299)
    if (!response.ok) {
      // Trigger error to divert execution into fallback catch block
      throw new Error(`External API returned non-200 HTTP status: ${response.status}`);
    }

    // Parse the received JSON response payload from the remote server
    const data = await response.json();

    // Store correct answer into server-side session to secure against client manipulation
    req.session.solution = data.solution;

    // Send puzzle image question URL to client without exposing the solution
    return res.json({ question: data.question });

  } catch (error) {
    // GRACEFUL DEGRADATION: Log external network failure to server console
    console.warn('⚠️ External API unavailable. Engaging fault-tolerant fallback cache:', error.message);

    // Bind fallback solution into user's session so game remains fully playable
    req.session.solution = FALLBACK_PUZZLE.solution;

    // Respond to frontend with identical contract structure so client continues seamlessly
    return res.json({ question: FALLBACK_PUZZLE.question });
  }
};

// Controller method to validate player's guess against session solution
exports.checkAnswer = (req, res) => {
  // Extract player's submitted guess from request body
  const { guess } = req.body;

  // Retrieve correct solution previously saved in session (whether live API or fallback)
  const solution = req.session.solution;

  // Compare parsed integer guess against stored solution
  if (parseInt(guess, 10) === solution) {
    // Respond that answer is correct
    return res.json({ correct: true, message: 'Correct! Well done!' });
  }

  // Respond that answer is incorrect and reveal answer
  return res.json({ correct: false, message: `Incorrect! The correct answer was ${solution}` });
};
