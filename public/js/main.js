$(function() {
  var update_visibility = function(e) {
	$('.prog-BS').toggle($('#hide-ch-type input[value="BS"]').prop("checked"));
	$('.prog-CS').toggle($('#hide-ch-type input[value="CS"]').prop("checked"));
	$('.prog-GR').toggle($('#hide-ch-type input[value="GR"]').prop("checked"));

	if($('#hide-prog-status input[value="f"]').prop("checked")) {
	  $('div.f').hide();
	}
	if($('#hide-prog-status input[value="r"]').prop("checked")) {
	  $('div.r').hide();
	}
	if($('#hide-prog-status input[value="a"]').prop("checked")) {
	  $('div.a').hide();
	}
	if($('#hide-prog-status input[value="nl"]').prop("checked")) {
	  $('div.nl').hide();
	} else {
	  $('div.nl').not("div.f").show();
    }
	$('#count-shown').text($('.program:visible').length);
  };

  var initialize_toggle = function(index, elem) {
	var $this = $(this);
	if($this.prop("checked")) $this.parent("label").button("toggle");
  };

  $('#hide-ch-type input').each(initialize_toggle);
  $('#hide-prog-status input').each(initialize_toggle);

  update_visibility();

  $("#hide-prog-status").on("change", "input", update_visibility);
  $("#hide-ch-type").on("change", "input", update_visibility);

  $('#keyword').on("focus", function() {
  });
});

