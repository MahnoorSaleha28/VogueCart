module.exports = (req, res, next) => {
    if (!req.session || !req.session.admin) {
        return res.redirect("/admin/login");
    }
    // The demo account can look around but not change anything (logging out is still allowed)
    if (req.session.admin.role === "demo" && req.method !== "GET" && req.path !== "/logout") {
        req.session.errorMessage = "This is a read-only demo, so changes aren't saved.";
        return res.redirect(req.get("Referrer") || "/admin/dashboard");
    }
    next();
};
