import jwt from "jsonwebtoken";

import n2words from "n2words";
export const authenticateToken = (req, res, next) => {
  const { token } = req.cookies;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    // console.log("middleWare : ", req.user);
    next();
  });
};

export function numberToFrenchWords(amount) {
  const [dirhams, centimes] = amount.toFixed(2).split(".");

  const dirhamsWords = n2words(parseInt(dirhams), { lang: "fr" });

  const centimesInt = parseInt(centimes);
  const centimesWords = centimesInt > 0
    ? ` et ${n2words(centimesInt, { lang: "fr" })} centimes`
    : "";

  return `${dirhamsWords} dirhams${centimesWords}`;
}
