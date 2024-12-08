function filterProducts(category) {
    const url = category === 'All' ? '/clothes' : `/clothes?category=${encodeURIComponent(category)}`;
    window.location.href = url; // Redirect to the appropriate URL
  }