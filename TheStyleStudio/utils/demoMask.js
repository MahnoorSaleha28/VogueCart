// Hides real customers' personal details from the read-only demo admin.
// The documents are only changed in memory for rendering; they are never saved.

const isDemo = (req) => Boolean(req.session.admin && req.session.admin.role === "demo");

// "Mahnoor Saleha" -> "Mahnoor S."
function maskName(name) {
  const parts = (name || "").trim().split(/\s+/);
  if (parts.length < 2) return parts[0] || "";
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

// "+923001234567" -> "•••• ••• 567"
function maskPhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length > 3 ? `•••• ••• ${digits.slice(-3)}` : "••••";
}

// "maryam@gmail.com" -> "ma•••@gmail.com"
function maskEmail(email) {
  const [user, domain] = (email || "").split("@");
  if (!domain) return "•••";
  return `${user.slice(0, 2)}•••@${domain}`;
}

function maskOrder(order) {
  order.name = maskName(order.name);
  order.phone = maskPhone(order.phone);
  order.address = "Address hidden in demo";
  return order;
}

function maskUser(user) {
  user.name = maskName(user.name);
  user.email = maskEmail(user.email);
  return user;
}

module.exports = { isDemo, maskOrder, maskUser };
