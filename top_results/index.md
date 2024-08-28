---
hide:
  - navigation
  - toc
---

<html>

<h2 id="topresults_heading" class="results_table_heading"></h2>

        
<div id="topresults_table_wrapper" class="resultstable_wrapper">
</div>

<hr>

  <div id="chartContainer1" class="bgtext" style="height: 370px; width: 100%;"></div>
<button class="btn btn-primary"  id="printChart1">Download</button>

<div id="chartContainer2" class="bgtext" style="height: 370px; width: 100%;"></div>
<button class="btn btn-primary"  id="printChart2">Download</button>

<div id="chartContainer3" class="bgtext" style="height: 370px; width: 100%;"></div>
<button class="btn btn-primary"  id="printChart3">Download</button>



 <form id="resultSelectionForm" method="post" action="">
        <h3>Choose the comparison</h3>

        <div class="form-field">
            <label for="category">Category</label>
            <select id="category" name="category" class="col myFilter">
                <option value='datacenter' >Datacenter</option>
<option value='edge' >Edge</option>

            </select>
        </div>

        <div class="form-field">
            <label for="division">Division</label>
            <select id="division" name="division" class="col myFilter">
                <option value='closed' selected>Closed</option>
<option value='open' >Open</option>

            </select>
        </div>

        <div class="form-field">
            <label for="availability">Availability</label>
            <select id="availability" name="availability" class="col myFilter">
                <option value='available' selected >Available</option>
                <option value='preview' >Preview</option>
                <option value='rdi' >RDI</option>
            </select>
        </div>

        <div class="form-field">
            <label for="model">Model</label>
            <select id="model" name="model" class="col">
            </select>
        </div>

        <div class="form-field">
            <label for="scenario">Scenario</label>
            <select id="scenario" name="scenario" class="col">
                <option value='Offline' selected>Offline</option>
                <option value='Server'>Server</option>
                <option value='SingleStream'>SingleStream</option>
                <option value='MultiStream'>MultiStream</option>
            </select>
        </div>

        <div class="form-field">
            <label for="metric">Metric</label>
            <select id="metric" name="metric" class="col">
                <option value="peak_performance" selected >Peak performance</option>
                <option value="power_efficiency" >Power efficiency</option>
                <option value="performance_per_accelerator">Performance per accelerator</option>
                <option value="performance_per_core">Performance per core</option>
            </select>
        </div>

        <div class="form-field">
            <label for="filter_systems">Filter Systems</label>
             <select id="filter_systems" name="filter_systems[]" class="col" multiple size="10">
            </select>
        </div>

        <div class="form-field">
            <label for="filter_devices">Filter Devices</label>
            <select id="filter_devices" name="filter_devices[]" class="col" multiple size="5">
            </select>
        </div>

        <div class="form-field">
            <button type="submit" name="submit" value="1" id="topresults_tablesorter">Submit</button>
        </div>
    </form>




<script type="text/javascript">
var sortcolumnindex = 5, perfsortorder = 1;
</script>

<script type="text/javascript" src="javascripts/topresults.js"></script>
<script type="text/javascript" src="javascripts/topresults_charts.js"></script>
<script type="text/javascript" src="javascripts/tablesorter.js"></script>


</html>
