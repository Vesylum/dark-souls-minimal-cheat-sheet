(function($) {
    "use strict";

    function storageGet(key, def) {
        const val = window.localStorage.getItem(key);
        if (val === null) {
            return $.extend(true, {}, def);
        }
        try {
            return JSON.parse(val);
        } catch (e) {
            storageDelete(key);
            return $.extend(true, {}, def);
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
        loadChecklists();
        populateProfiles();

        $('#playthroughFilter').on('input', function() {
            filterItems(this.value, '#playthrough_sections');
        });

        $('#checklistFilter').on('input', function() {
            filterItems(this.value, '#checklists');
        });

        $(document).on('change', 'input[type="checkbox"]', function () {
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
            if (confirm('Reset all progress?')) {
                resetProgress();
            }
        });

        $('#progressExport').click(function() {
            const data = serializeProfiles();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const $link = $('#progressDownload');
            if ($link.length) {
                $link.attr('href', url);
                $link[0].click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
        });

        $('#progressImport').click(function() {
            const $file = $('#progressFile');
            if ($file.length) {
                $file.trigger('click');
            }
        });

        $('#progressFile').change(function() {
            const file = this.files[0];
            if (!file) {
                return;
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                const ok = restoreProfiles(e.target.result);
                if (!ok) {
                    $('#importError').text('Invalid progress data');
                } else {
                    $('#importError').text('');
                }
            };
            reader.onerror = function() {
                $('#importError').text('Unable to read file');
            };
            reader.readAsText(file);
            $(this).val('');
        });

        $('#profileModalAdd').click(function(event) {
            event.preventDefault();
            const $name = $('#profileModalName');
            const profile = $.trim($name.val());
            if (profile.length > 0) {
                if (typeof profiles[profilesKey][profile] !== 'undefined') {
                    alert('Profile already exists');
                    return;
                }
                profiles[profilesKey][profile] = { checklistData: {} };
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
        label.htmlFor = id;

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = id;
        label.appendChild(input);

        // Move existing nodes (until a child list) into the label
        while (el.firstChild && !(el.firstChild.nodeType === 1 && el.firstChild.tagName === 'UL')) {
            label.appendChild(el.firstChild);
        }

        input.setAttribute('aria-label', label.textContent.trim());

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

    function serializeProfiles() {
        return JSON.stringify(profiles);
    }

    function restoreProfiles(json) {
        let data;
        try {
            data = JSON.parse(json);
        } catch (e) {
            return false;
        }
        if (!data || typeof data !== 'object' || !(profilesKey in data)) {
            return false;
        }
        if (typeof data.current !== 'string') {
            return false;
        }

        const importedProfiles = data[profilesKey];
        if (!importedProfiles || typeof importedProfiles !== 'object') {
            return false;
        }

        for (const name in importedProfiles) {
            const entry = importedProfiles[name];
            if (!entry || typeof entry !== 'object') {
                return false;
            }
            if (!('checklistData' in entry)) {
                return false;
            }
            const notArray = !Array.isArray(entry.checklistData);
            if (typeof entry.checklistData !== 'object' || entry.checklistData === null || !notArray) {
                return false;
            }
        }

        if (!(data.current in importedProfiles)) {
            return false;
        }

        profiles = data;
        storageSet(profilesKey, profiles);
        populateProfiles();
        populateChecklists();
        return true;
    }

    function canDelete() {
        return Object.keys(profiles[profilesKey]).length > 1;
    }

    function getFirstProfile() {
        return Object.keys(profiles[profilesKey])[0];
    }

    function loadPlaythrough() {
        const request = $.getJSON('data/playthrough.json', function(data) {
            renderPlaythrough(data);
            $('li[data-id]').each(function () { addCheckbox(this); });
            populateChecklists();
        });
        if (request && typeof request.fail === 'function') {
            request.fail(function() {
                const msg = 'Failed to load playthrough data';
                alert(msg);
                $('#playthrough_sections').html(
                    '<p class="text-danger">' + msg + '</p>'
                );
            });
        }
    }

    function loadChecklists() {
        const request = $.getJSON('data/checklists.json', function(data) {
            renderChecklists(data);
            $('li[data-id]').each(function () { addCheckbox(this); });
            populateChecklists();
        });
        if (request && typeof request.fail === 'function') {
            request.fail(function() {
                const msg = 'Failed to load checklist data';
                alert(msg);
                $('#checklists').html(
                    '<p class="text-danger">' + msg + '</p>'
                );
            });
        }
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

            const $details = $('<details></details>');
            if (i === 0) {
                $details.attr('open', true);
            }
            const $summary = $('<summary></summary>');
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
            $summary.append($header);
            $details.append($summary);

            const $ul = $('<ul></ul>');
            buildItems(section.items, $ul);
            $details.append($ul);
            $container.append($details);
        });
    }

    function renderChecklists(sections) {
        const $container = $('#checklists');
        $container.empty();

        const $nav = $('<ul></ul>');
        $container.append($nav);
        $container.append('<hr />');

        const $sections = $('<div></div>');
        $container.append($sections);

        $.each(sections, function(i, section) {
            const index = i + 1;
            const $navLi = $('<li></li>');
            $navLi.append($('<a></a>').attr('href', '#' + section.id).text(section.title));
            $navLi.append(' <span id="checklist_nav_totals_' + index + '"></span>');
            $nav.append($navLi);

            const $details = $('<details></details>');
            if (i === 0) {
                $details.attr('open', true);
            }
            const $summary = $('<summary></summary>');
            const $header = $('<h3></h3>').attr('id', section.id).text(section.title);
            $header.append(' <span id="checklist_totals_' + index + '"></span>');
            $summary.append($header);
            $details.append($summary);

            const $ul = $('<ul></ul>');
            buildItems(section.items, $ul);
            $details.append($ul);
            $sections.append($details);
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

    function filterItems(query, containerSelector) {
        const q = query.toLowerCase();
        $(containerSelector).find('li[data-id]').each(function() {
            const $li = $(this);
            const ownText = $li.clone().children('ul').remove().end().text().toLowerCase();
            let match = ownText.indexOf(q) !== -1;
            if (!match) {
                $li.find('li[data-id]').each(function() {
                    const subText = $(this).clone().children('ul').remove().end().text().toLowerCase();
                    if (subText.indexOf(q) !== -1) {
                        match = true;
                        return false; // break loop
                    }
                });
            }
            $li.toggle(match);
        });
    }

    // Expose functions for testing
    if (typeof window !== 'undefined') {
        window.calculateTotals = calculateTotals;
        window.resetProgress = resetProgress;
        window.serializeProfiles = serializeProfiles;
        window.restoreProfiles = restoreProfiles;
        window.populateProfiles = populateProfiles;
        window.populateChecklists = populateChecklists;
        window.filterItems = filterItems;
        window.canDelete = canDelete;
        window.getFirstProfile = getFirstProfile;
    }

})( jQuery );
