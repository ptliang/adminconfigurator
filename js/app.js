(function() {
	window.app = {views:{}, models: {}, collections: {}};

	app.dragDropObj = {};

	app.Option = Backbone.Model.extend({

	});

	app.Options = Backbone.Collection.extend({
		model: app.Option
	});

	app.Category = Backbone.Model.extend({
		initialize: function(attributes) {
			this._options = new app.Options();
			attributes.includes.sort();
			_.each(attributes.includes, function(option, index, list) {
				var option = new app.Option(app.configSet.options[option]);
				option.set("category", this.attributes.code);
				this._options.add(option);
			}, this)
		}
	});

	app.CurrentConfigOptions = Backbone.Collection.extend({
		model: app.Option
	});

	app.CurrentConfig = Backbone.Model.extend({
	});

	app.AppView = Backbone.View.extend({
		// el - stands for element. Every view has a element associate in with HTML
		//      content will be rendered.
		el: ".container",

		template: _.template($("#app-search").html()),

		// It"s the first function called when this view it"s instantiated.
		initialize: function(){
			this.getConfigSet();
			this.getConfigSetPrices();
			app.currentConfigOpts = new app.CurrentConfigOptions();
			app.currentConfigOpts.on('reset', function(collection, options) {
			_.each(options.previousModels, function(model) {
				model.trigger('remove');
			})
	})
			this.render();
		},

		render: function() {
			this.$el.append(this.template);
		  	this.rn = this.$("#rn");
		  	return this;
		},

		events: {
			"click #search-by-rn": "searchByRN",
			"keypress": "searchOnEnter",
			"click #create-new": "createNewConfig"
		},

		createNewConfig: function(e) {
			this.$el.append(new app.ConfiguratorView().render().el);
			return false;
		},

		searchOnEnter: function(e) {
			if (e.which === 13) {
	          this.searchByRN(e);
	        }
		},

		searchByRN: function(e) {

		},

		getConfigSet: function() {
			$.getJSON("data/configSet.json", function(data) {
				app.configSet = data;
			});
		},

		getConfigSetPrices: function() {
			$.getJSON("data/configSetPrices.json", function(data) {
				app.configSetPrices = data;
				app.currentConfig = new app.CurrentConfig({"base": data.base_price});
			})
		}
	});

	app.ConfiguratorView = Backbone.View.extend({
		id: "configurator-view",

		className: "row",

		render: function() {
			this.$el.html(new app.OptionsPanelView().render().el);
			this.$el.append(new app.SummaryPanelView().render().el);
			return this;
		}
	})

	app.OptionsPanelHeaderView = Backbone.View.extend({
		id: "base-price",

		template: _.template($("#options-panel-header-tpl").html()),

		initialize: function() {
			this.listenTo(app.currentConfig, "change:base", this.render)
			this.render();
		},

		render: function() {
			this.$el.html(this.template());
			this.input = this.$("#edit-base-price");
			return this;
		},

		events: {
			"dblclick span": "editPrice",
			"blur #edit-base-price": "close"
		},

		editPrice: function(event) {
			this.$el.addClass("editing");
			this.input.val(app.currentConfig.get("base"));
			this.input.focus();
		},

		close: function() {
			var newPrice = this.input.val().trim();
			app.currentConfig.set("base", newPrice);
			this.$el.removeClass("editing");
		}
	});

	app.OptionsPanelView = Backbone.View.extend({
		id: "options-panel",

		className: "col-md-8",

		initialize: function() {
			this._uiCategories = [];
			var categories = {};
			this._views = [];
			_.each(app.configSet.options, function(option, code, list) {
				option.code = code;
				if (!~_.indexOf(app.configSet.categories[option.category]["includes"], code)) {
					app.configSet.categories[option.category]["includes"].push(code);
				}
			}, this)

			// flatten categories to bubble all options to the top level cat
			_.each(app.configSet.categories, function(value, key, list) {
					value.code = key;
					if (value.admin_ui_select) {
						value.includes = this.flattenCategories(value, key, list);
						this._uiCategories.push(value);
					}
			}, this);

			// create category models and save corresponding views for later use
			_.each(this._uiCategories, function(category, index, list) {
				var catModel = new app.Category(category)
				app.models[category.code] = catModel;
				this._views.push(new app.OptionListView({model: catModel}));
			}, this)
		},

		render: function() {
			this.$el.empty();
			this.$el.html(new app.OptionsPanelHeaderView().render().el);
			var container = document.createDocumentFragment();
			_.each(this._views, function(subview) {
				container.appendChild(subview.render().el);
			})
			this.$el.append(container);
			return this;
		},

		flattenCategories: function(category, catName, allCategories) {
			if (_.has(allCategories, category.includes[0]))  {
				_.each(category.includes, function(element, index, list) {
					var options = this.flattenCategories(allCategories[element], element, allCategories);
					category.includes = _.union(category.includes, options);
					category.includes = _.without(category.includes, element);
				}, this);
				return category.includes
			}
			else {
				return category.includes;
			}
		}
	})

	app.OptionListView = Backbone.View.extend({
		tagName: "table",

		template: _.template($("#category-tpl").html()),

		className: "table table-striped table-hover category",

		render: function() {
			var header = this.model.get("name");
			var container = document.createDocumentFragment();
			this.model._options.each(function(option) {
				container.appendChild(new app.OptionItemView({model: option}).render().el);
			})
			this.$el.html(this.template(this.model.toJSON()));
			this.$("tbody").append(container);
			return this;
		}
	})

	app.OptionItemView = Backbone.View.extend({
		tagName: "tr",

		template: _.template($("#option-item-tpl").html()),

		initialize: function() {			
			this.listenTo(this.model, "change:price", this.render);
		},

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			this.$el.find('.option-name').attr("draggable", "true");
			this.input = this.$(".edit-option-price");
			return this;
		},

		events: {
			"click .option-name": "addToCurrentConfig",
			"dblclick .option-price": "editPrice",
			"blur .edit-option-price": "close",
			"keypress": "closeOnEnter",
			"dragstart": "_dragStartEvent",
			"dragend": "_dragEndEvent"
		},

		_dragStartEvent: function(event) {
			app.dragDropObj = this.model;
			event.originalEvent.dataTransfer.effectAllowed = "copy";
			this.$el.css('opacity', 0.4)
		},

		_dragEndEvent: function(even) {
			this.$el.css('opacity', 1)
			app.dragDropObj = {};
		},

		addToCurrentConfig: function(event) {
			var optionCode = this.model.get("code");
			var togglePair = "";
			// check if the option is not already in config
			if (app.currentConfigOpts.where({"code": optionCode}).length == 0) {
				var catCode = this.model.get("category");
				var catModel = app.models[catCode];
				var index;
				// if the cat is exclusive then must remove current option from that cat
				if (catModel.get("exclusive")) {
					var existingOpts = app.currentConfigOpts.where({"category": catCode});
					if (existingOpts[0]) {
						index = app.currentConfigOpts.indexOf(existingOpts[0]);
						app.currentConfigOpts.remove(existingOpts[0]);
					}
				}
				// toggle pair
				else if (togglePair = this.model.get("toggle_pair")) {
					var togglePairOpt = app.currentConfigOpts.where({"code": togglePair})
					if (togglePairOpt[0]) {
						index = app.currentConfigOpts.indexOf(togglePairOpt[0]);
						app.currentConfigOpts.remove(togglePairOpt[0]);
					}
				}
				app.currentConfigOpts.add(this.model, {at: index});
			}
		},

		editPrice: function(e) {
			event.stopPropagation();
			this.$el.addClass("editing");
			this.input.val(this.model.get("price"));
			this.input.focus();
		},

		closeOnEnter: function(e) {
			if (e.which == 13) {
				this.close();
			}
		},

		close: function() {
			var newPrice = this.input.val().trim();
			this.model.set("price", parseInt(newPrice));
			this.$el.removeClass("editing");
		}
	})

	app.SummaryPanelView = Backbone.View.extend({
		id: "summary-panel",

		className: "col-md-4",

		template: _.template($("#summary-panel-tpl").html()), 

		initialize: function() {
			// TODO: this is problematic, we are instantiating multiple instances of currentConfigView, having many ghost views
			// this.listenTo(app.currentConfigOpts, 'reset', this.resetCurrentConfigView);
		},

		render: function() {
			this.$el.html(this.template());
			this.$el.find(".sticky-sidebar").prepend(new app.CurrentConfigView().render().el);
			this.$(".sticky-sidebar").affix({
			  offset: {
			    top: 100
			  }
			})
			app.currentConfig.set('total', app.currentConfig.get('base'));
			return this;
		},

		events: {
			"click #reset-current-config": "resetCurrentConfig"
		},

		resetCurrentConfig: function() {
			app.currentConfigOpts.reset();
		}
	});

	app.CurrentConfigView = Backbone.View.extend({
		tagName: "table",

		id: "current-config",

		className: "table table-striped",

		template: _.template($("#current-config-tpl").html()), 

		initialize: function() {
			this.listenTo(app.currentConfig, "change:base", this.updateBasePrice);
			this.listenTo(app.currentConfigOpts, "add", this.addOne);
			this.listenTo(app.currentConfig, "change:total", this.updateTotalPrice);
		},

		render: function() {
			this.$el.html(this.template());
			return this;
		},

		events: {
			"dragenter .option-drop-zone div": "_dragEnterEvent",
			"dragover .option-drop-zone div": "_dragOverEvent",
			"dragleave .option-drop-zone div": "_dragLeaveEvent",
			"drop .option-drop-zone div": "_dropEvent"
		},

		_dragEnterEvent: function(event) {
			this.$(".option-drop-zone").addClass("drag-over");
			console.log("drag entering");
		},

		_dragOverEvent: function(event) {
			event.preventDefault();
			event.originalEvent.dataTransfer.dropEffect = 'copy'
			console.log('drag over');
		},

		_dragLeaveEvent: function(event) {
			this.$(".option-drop-zone").removeClass("drag-over");
			console.log('drag leaving');
		},

		_dropEvent: function(event) {
			this.$(".option-drop-zone").removeClass("drag-over");
			var optionCode = app.dragDropObj.get("code");
			var togglePair = "";
			// check if the option is not already in config
			if (app.currentConfigOpts.where({"code": optionCode}).length == 0) {
				var catCode = app.dragDropObj.get("category");
				var catModel = app.models[catCode];
				var index;
				// if the cat is exclusive then must remove current option from that cat
				if (catModel.get("exclusive")) {
					var existingOpts = app.currentConfigOpts.where({"category": catCode});
					if (existingOpts[0]) {
						index = app.currentConfigOpts.indexOf(existingOpts[0]);
						app.currentConfigOpts.remove(existingOpts[0]);
					}
				}
				// toggle pair
				else if (togglePair = app.dragDropObj.get("toggle_pair")) {
					var togglePairOpt = app.currentConfigOpts.where({"code": togglePair})
					if (togglePairOpt[0]) {
						index = app.currentConfigOpts.indexOf(togglePairOpt[0]);
						app.currentConfigOpts.remove(togglePairOpt[0]);
					}
				}
				app.currentConfigOpts.add(app.dragDropObj, {at: index});
			}
		},

		addOne: function(option) {
			this.$el.append(new app.CurrentConfigOptionView({model: option}).render().el);
		},

		removeOne: function(option) {
			var oldTotal = app.currentConfig.get("total");
			app.currentConfig.set("total", oldTotal - option.get("price"));
		},

		addAll: function() {

		},

		updateBasePrice: function(model) {
			var newBase = model.get("base");
			var prevBase = model.previous("base");
			this.$("#base-current").text(newBase);
			var change = parseInt(newBase, 10) - parseInt(prevBase, 10);
			var total = parseInt(this.$("#total-current").text(), 10);
			this.$("#total-current").text("$" + (total + change));
		},

		updateTotalPrice: function(model) {
			this.$("#total-current").text("$" + model.get("total"));
		}
	});

	 app.CurrentConfigOptionView = Backbone.View.extend({
	 	tagName: "tr",

		template: _.template($("#current-config-option-item-tpl").html()),

		initialize: function() {
			this.listenTo(this.model, "change:price", this.render);
			this.listenTo(this.model, "remove", this.destroy);
		},

		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			var total = app.currentConfig.get("total");
			if (this.model.hasChanged("price")) {
				var current = this.model.get("price");
				var prev = this.model.previous("price");
				app.currentConfig.set("total", total + current - prev);
			}
			else {
				app.currentConfig.set("total", total + this.model.get("price"));
			}
			return this;
		},

		events: {
			"click .delete-option": "removeOption"
		},

		removeOption: function() {
			app.currentConfigOpts.remove(this.model);
		},

		destroy: function(model, collection, index) {
			var total = app.currentConfig.get("total");
			app.currentConfig.set("total", total - this.model.get("price"));
			this.remove();
		}
	 });

	app.AppRouter = Backbone.Router.extend({
		routes: {

		}
	});

	app.appView = new app.AppView();
})();