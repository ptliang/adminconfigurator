<!DOCTYPE html>
<html>
  <head>
    <title>Admin Configurator</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Bootstrap -->
    <link rel="stylesheet" href="vendor/bootstrap/css/bootstrap.min.css">
    <link href="css/style.css" rel="stylesheet" media="screen">
  </head>
  <body>
    <div class="container">
      <div class="page-header">
        <h3>Admin Configurator</h3>
      </div>
    </div>
    <script src="vendor/jquery/jquery-2.1.3.min.js"></script>
    <script src="vendor/bootstrap/js/bootstrap.min.js"></script>
    <script src="vendor/underscore/underscore.js"></script>
    <script src="vendor/backbone/backbone.js"></script>
    <script type="text/template" id="app-search">
      <div class="row" id="search-view">
        <div class="col-md-8">
          <form class="form-inline">
            <div class="form-group">
              <div id="search-box" class="input-group">
                <input type="text" id="rn" class="form-control" placeholder="12345" />
                <span class="input-group-btn">
                  <button id="search-by-rn" class="btn btn-primary" type="button">Search</button>
                </span>
              </div>
            </div>
            <div class="form-group">
              <span> OR </span>
              <button id="create-new" class="btn btn-primary" type="button">Create</button>
            </div>
          </form>
        </div>
      </div>
    </script>

    <script type="text/template" id="configurator-tpl">
      <div class="row" id="configurator-view">
      </div>
    </script>

    <script type="text/template" id="options-panel-header-tpl">
       <h4>Base Price: </h4><span><%= app.currentConfig.attributes.base ? app.currentConfig.attributes.base : app.configSet.base_price %></span><input type="text" id="edit-base-price" />
    </script>

    <script type="type/template" id="category-tpl">
      <thead>
        <tr>
          <th colspan="3"><h4><%= name %></h4></th>
        </tr>
      </thead>
      <tbody>
        <tr><th>Option</th><th>Price</th><th>Orig. Price</th>
      </tbody>
    </script>

    <script type="type/template" id="option-item-tpl">
        <td class="option-name"><%= name %> (<%= code %>)</td><td class="option-price"><span>$<%= price %></span><input type="text" class="edit-option-price" /></td><td class="original-option-price"></td>
    </script>

    <script type="type/template" id="current-config-tpl">
        <thead>
          <tr><td colspan=3 class="option-drop-zone"><div>Drag an option here to add to configuration</div></td></tr>
        </thead>
        <tbody>
        </tbody>
        <tfoot>
          <tr><th>Base: </th><td id="base-current">$<%= app.currentConfig.get('base') %></td><td></td></tr>
          <tr><th>Total: </th><td id="total-current">$<%= app.currentConfig.get('total') %></td><td></td></tr>
        </tfoot>
    </script>

    <script type="type/template" id="current-config-option-item-tpl">
        <td class="option-name"><%= name %> (<%= code %>)</td><td class="option-price">$<%= price %></td><td><button type="button" class="delete-option btn btn-danger btn-xs">Delete</btn></td>
    </script>

    <script type="type/template" id="summary-panel-tpl">
      <div class="sticky-sidebar">
        <button id="reset-current-config" class="btn">Reset</button>
        <button id="save-current-config" class="btn">Save</button>
      </div>
    </script>

    <script src="js/app.js"></script>
  </body>
</html>