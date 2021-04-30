jQuery.ajax({
  type: "GET",
  dataType: "json",
  url: `/api/hasher/${hasherId}`,
  success: function(data) {
    jQuery('#real_name').val(data.real_name);
    jQuery('#hash_name').val(data.hash_name);
    jQuery('#fb_name').val(data.fb_name);
    jQuery('#fb_url').val(data.fb_url);
    jQuery('#kennel').val(data.kennel);
    jQuery('#notes').val(data.notes);
  },
  error: function() {
    console.log("ERROR: hasher.ejs - something happened");
  },
});
