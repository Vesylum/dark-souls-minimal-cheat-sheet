(function($) {
    "use strict";

    function storageGet(key, def) {
        const val = window.localStorage.getItem(key);
        if (val === null) {
            return def;
        }
        try {
            return JSON.parse(val);
        } catch (e) {
            return def;
        }
    }

    function storageSet(key, val) {
        window.localStorage.setItem(key, JSON.stringify(val));
    }

    function storageDelete(key) {
        window.localStorage.removeItem(key);
    }

    const profilesKey = window.profilesKey || 'profiles';

    const defaultProfiles = {
        'current': 'Default Profile'
    };
    defaultProfiles[profilesKey] = {
        'Default Profile': {
            checklistData: {}
        }
    }
    let profiles = storageGet(profilesKey, defaultProfiles);

    jQuery(document).ready(function($) {

        loadPlaythrough();
        populateProfiles();

        $('input[type="checkbox"]').click(function() {
            const $checkbox = $(this);
            const id = $checkbox.attr('id');
            const isChecked = profiles[profilesKey][profiles.current].checklistData[id] = $checkbox.prop('checked');
            $checkbox.parent().parent().find('li > label > input[type="checkbox"]').each(function() {
                const childId = $(this).attr('id');
                profiles[profilesKey][profiles.current].checklistData[childId] = isChecked;
                $(this).prop('checked', isChecked);
            });
            storageSet(profilesKey, profiles);
            calculateTotals();
        });

        $('#profiles').change(function(event) {
            const $select = $(this);
            profiles.current = $select.val();
            storageSet(profilesKey, profiles);
            populateChecklists();
        });

        $('#profileAdd').click(function() {
            $('#profileModalTitle').html('Add Profile');
            $('#profileModalName').val('');
            $('#profileModalAdd').show();
            $('#profileModalUpdate').hide();
            $('#profileModalDelete').hide();
            $('#profileModal').modal('show');
        });

        $('#profileEdit').click(function() {
            $('#profileModalTitle').html('Edit Profile');
            $('#profileModalName').val(profiles.current);
            $('#profileModalAdd').hide();
            $('#profileModalUpdate').show();
            if (canDelete()) {
                $('#profileModalDelete').show();
            } else {
                $('#profileModalDelete').hide();
            }
            $('#profileModal').modal('show');
        });

        $('#progressReset').click(function() {
            resetProgress();
        });

        $('#profileModalAdd').click(function(event) {
            event.preventDefault();
            const $name = $('#profileModalName');
            const profile = $.trim($name.val());
            if (profile.length > 0) {
                if (typeof profiles[profilesKey][profile] == 'undefined') {
                    profiles[profilesKey][profile] = { checklistData: {} };
                }
                profiles.current = profile;
                storageSet(profilesKey, profiles);
                populateProfiles();
                populateChecklists();
            }
            $('#profileModal').modal('hide');
        });

       $('#profileModalUpdate').click(function(event) {
           event.preventDefault();
           const $name = $('#profileModalName');
           const newName = $.trim($name.val());
            if (newName.length > 0 && newName != profiles.current) {
                if (typeof profiles[profilesKey][newName] !== 'undefined') {
                    alert('Profile already exists');
                    return;
                }
                profiles[profilesKey][newName] = profiles[profilesKey][profiles.current];
                delete profiles[profilesKey][profiles.current];
                profiles.current = newName;
                storageSet(profilesKey, profiles);
                populateProfiles();
                $('#profileModal').modal('hide');
            } else {
                $('#profileModal').modal('hide');
            }
       });

        $('#profileModalDelete').click(function(event) {
            event.preventDefault();
            if (!canDelete()) {
                return;
            }
            if (!confirm('Are you sure?')) {
                return;
            }
            delete profiles[profilesKey][profiles.current];
            profiles.current = getFirstProfile();
            storageSet(profilesKey, profiles);
            populateProfiles();
            populateChecklists();
            $('#profileModal').modal('hide');
        });

        $('#profileModalClose').click(function(event) {
            event.preventDefault();
            $('#profileModal').modal('hide');
        });

        calculateTotals();

    });

    function populateProfiles() {
        $('#profiles').empty();
        $.each(profiles[profilesKey], function(index, value) {
            $('#profiles').append($("<option></option>").attr('value', index).text(index));
        });
        $('#profiles').val(profiles.current);
    }

    function populateChecklists() {
        $('input[type="checkbox"]').prop('checked', false);
        $.each(profiles[profilesKey][profiles.current].checklistData, function(index, value) {
            $('#' + index).prop('checked', value);
        });
        calculateTotals();
    }

    function calculateTotals() {
        $('[id$="_overall_total"]').each(function() {
            const $overall = $(this);
            const type = this.id.match(/(.*)_overall_total/)[1];
            let overallCount = 0, overallChecked = 0;
            $('[id^="' + type + '_totals_"]').each(function() {
                const $total = $(this);
                const regex = new RegExp(type + '_totals_(.*)');
                const i = parseInt(this.id.match(regex)[1]);
                let count = 0, checked = 0;
                for (let j = 1; ; j++) {
                    const $checkbox = $('#' + type + '_' + i + '_' + j);
                    if ($checkbox.length === 0) {
                        break;
                    }
                    count++;
                    overallCount++;
                    if ($checkbox.prop('checked')) {
                        checked++;
                        overallChecked++;
                    }
                }
                const $navTotals = $('#' + type + '_nav_totals_' + i);
                if (checked === count) {
                    $total[0].innerHTML = $navTotals[0].innerHTML = '[DONE]';
                    $total.removeClass('in_progress').addClass('done');
                    $navTotals.removeClass('in_progress').addClass('done');
                } else {
                    $total[0].innerHTML = $navTotals[0].innerHTML = '[' + checked + '/' + count + ']';
                    $total.removeClass('done').addClass('in_progress');
                    $navTotals.removeClass('done').addClass('in_progress');
                }
            });
            if (overallChecked === overallCount) {
                $overall[0].innerHTML = '[DONE]';
                $overall.removeClass('in_progress').addClass('done');
            } else {
                $overall[0].innerHTML = '[' + overallChecked + '/' + overallCount + ']';
                $overall.removeClass('done').addClass('in_progress');
            }
        });
    }

    function addCheckbox(el) {
        const id = el.getAttribute('data-id');

        const label = document.createElement('label');
        label.className = 'checkbox';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = id;
        label.appendChild(input);

        // Move existing nodes (until a child list) into the label
        while (el.firstChild && !(el.firstChild.nodeType === 1 && el.firstChild.tagName === 'UL')) {
            label.appendChild(el.firstChild);
        }

        el.insertBefore(label, el.firstChild);

        if (profiles[profilesKey][profiles.current].checklistData[id] === true) {
            input.checked = true;
        }
    }

    function resetProgress() {
        storageDelete(profilesKey);
        profiles = $.extend(true, {}, defaultProfiles);
        storageSet(profilesKey, profiles);
        populateProfiles();
        populateChecklists();
    }

    function canDelete() {
        let count = 0;
        $.each(profiles[profilesKey], function(index, value) {
            count++;
        });
        return (count > 1);
    }

    function getFirstProfile() {
        for (const profile in profiles[profilesKey]) {
            return profile;
        }
    }

    function loadPlaythrough() {
        $.getJSON('data/playthrough.json', function(data) {
            renderPlaythrough(data);
            $('li[data-id]').each(function () { addCheckbox(this); });
            populateChecklists();
        });
    }

    function renderPlaythrough(sections) {
        const $nav = $('#playthrough_nav');
        const $container = $('#playthrough_sections');
        $nav.empty();
        $container.empty();
        $.each(sections, function(i, section) {
            const index = i + 1;
            const $navLi = $('<li></li>');
            $navLi.append($('<a></a>').attr('href', '#' + section.id).text(section.title));
            if (section.level) {
                $navLi.append(' (' + section.level + ')');
            }
            $navLi.append(' <span id="playthrough_nav_totals_' + index + '"></span>');
            $nav.append($navLi);

            const $header = $('<h3></h3>').attr('id', section.id);
            if (section.href) {
                $header.append($('<a></a>').attr('href', section.href).text(section.title));
            } else {
                $header.text(section.title);
            }
            if (section.level) {
                $header.append(' (' + section.level + ')');
            }
            $header.append(' <span id="playthrough_totals_' + index + '"></span>');
            $container.append($header);

            const $ul = $('<ul></ul>');
            buildItems(section.items, $ul);
            $container.append($ul);
        });
    }

    function buildItems(items, $ul) {
        $.each(items, function(_, item) {
            const $li = $('<li></li>').attr('data-id', item.id).html(item.content);
            if (item.children) {
                const $child = $('<ul></ul>');
                buildItems(item.children, $child);
                $li.append($child);
            }
            $ul.append($li);
        });
    }

    // Expose functions for testing
    if (typeof window !== 'undefined') {
        window.calculateTotals = calculateTotals;
        window.resetProgress = resetProgress;
        window.populateProfiles = populateProfiles;
        window.populateChecklists = populateChecklists;
    }

})( jQuery );
