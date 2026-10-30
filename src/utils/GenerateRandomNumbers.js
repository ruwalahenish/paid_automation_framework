export function GenerateRandomNumbers(length) {
  var chars = "1234567890";
  var randomNumbers = "";
  for (var i = 0; i < length; i++) {
    var randomIndex = Math.floor(Math.random() * chars.length);
    randomNumbers += chars[randomIndex];
  }
  return randomNumbers;
}
