/***
@controller Name:ui.s2p.mm.manage.stock.controller.S1,
*@viewId:application-adaptationproject-display-component---S1
*/
/*!
 * OpenUI5
 * (c) Copyright 2009-2023 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	'sap/ui/core/mvc/ControllerExtension',
	'ui/s2p/mm/manage/stock/controller/S1.controller',
	'sap/ui/core/format/DateFormat',
	"sap/ui/Device",
	"sap/m/Label",
	'ui/s2p/mm/manage/stock/controller/utils/SerialNumbers.controller'
	// ,'sap/ui/core/mvc/OverrideExecution'
],
	function (
		ControllerExtension, S1Controller, DateFormat, Device, Label, SerialNumbersController
		// ,OverrideExecution
	) {
		"use strict";

		const originalPrototype = Object.assign({}, S1Controller.prototype);

		S1Controller.prototype._createPostDialogManage = function (oFirstEvtContainer) {

			// do whatever custom stuff you need

			// you can still call the original method too
			//originalPrototype.onDeliveryHeaderSelected.apply(this, arguments);


			var sJson = this._getFrontendJson();
			var oDateInputFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "dd.MM.yyyy"
			});
			var oCurrentDate = oDateInputFormat.format(new Date());
			var bCostCenterVisible = false;
			// show cost center, when scrapping is selected
			if (this._ManagedStockType_selectedKey === "2") {
				bCostCenterVisible = true;
			}

			var oModels = this._getModels();

			var aFilters = [];

			aFilters.push(new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, sJson.selectedPlant));

			//jQuery.proxy(this.successCallback, this),
			oModels.MatDoc.read("/CostCenterHelps", {
				filters: aFilters,
				success: jQuery.proxy(this._successCostCenterLoad, this),
				error: jQuery.proxy(this._loadError, this)
			});

			// only show initial entry when the start stock quantity is 0
			var aManagedStockTypes = this._getAllowedActions(oFirstEvtContainer.Quantity);

			var sJsonPopup = {
				PostingDate: oCurrentDate,
				PostingDate_valueState: sap.ui.core.ValueState.None,
				DocumentDate: oCurrentDate,
				PostingDate_width: "100%",
				PostingDate_valueStateText: "",
				DocumentDate_valueState: sap.ui.core.ValueState.None,
				DocumentDate_width: "100%",
				ProductionDate: "",
				ShelfLifeExpirationDate: "",
				StartStorageLocation: oFirstEvtContainer.StorageLocation,
				StartStockType: oFirstEvtContainer.StockType,
				StartStockQuantity: oFirstEvtContainer.Quantity,
				StartStorageLocationName: oFirstEvtContainer.StorageLocationName,
				StartStockTypeLabel: this.getModel("oMaterialData").getProperty("/#MaterialPlant/" + oFirstEvtContainer.StockType + "/@sap:label"),
				StartSpecialStockTypes: [],
				StartSpecialStockType: oFirstEvtContainer.SpecialStockType,
				ValueHelpSpecialStockModel_selectedKey: "",
				StartWBSElement: "",
				DropDownSpecialStockModel_valueState: sap.ui.core.ValueState.None,
				ValueHelpSpecialStockModel_valueState: sap.ui.core.ValueState.None,
				ManagedStockTypes: aManagedStockTypes,
				ManagedStockType_selectedKey: this._ManagedStockType_selectedKey,
				CostCenterVisible: bCostCenterVisible,
				CostCenterEnabled: false,
				CostCenter_valueState: sap.ui.core.ValueState.None,
				GoodsMovementReasonCode_selectedKey: "",
				PostButtonEnabled: false,
				Quantity: 0,
				MaxQuantity: this._maxQuantity,
				Quantity_valueState: sap.ui.core.ValueState.Error,
				Quantity_valueStateText: this.getResourceBundle().getText("QUANTITY_VALUE_STATE_TEXT"),
				Unit: sJson.BaseUnit,
				QuantityUnit: sJson.BaseUnit,
				AlternativeUnitIsVisible: sJson.AlternativeUnitIsVisible,
				MaterialHeaderText: "",
				DocumentItemText: "",
				CreateSerialNoAutomatic: false,
				MatDocItem2Serial: "",
				maxFractionDigits: sJson.maxFractionDigits,
				IsAutoCreatedStorLoc: oFirstEvtContainer.IsAutoCreatedStorLoc,
				bSmallDevice: sJson.bSmallDevice,
				SerialNumbersVisible: false,
				SerialNumbersMandatory: false,
				SerialNumbersKeepLeadingZeros: false,
				SerialNumbers_placeholder: "",
				OptSerialNumbersInfoMessageVisible: false,
				OptSerialNumbersInfoMessageText: ""
			};
			var oItem;
			// Standard Stock
			oItem = {};
			oItem.StartSpecialStockType = " ";
			oItem.StartSpecialStockTypeLabel = this.getResourceBundle().getText("LABEL_STANDARDSTOCK");
			oItem.StartStockQuantity = sJsonPopup.StartStockQuantity;
			//if (this._sSAPMMIMAppType ===
			//"manage") {
			var rowLength = oFirstEvtContainer.InventorySpecialStockTypePerStockType.length;
			for (var i = 0; i < rowLength; i++) {
				var sQuantitySub = oFirstEvtContainer.InventorySpecialStockTypePerStockType[i];
				if (sQuantitySub.InventorySpecialStockType === 'K') {
					oItem.StartStockQuantity = oItem.StartStockQuantity - sQuantitySub.Quantity;
				}
			};
			//};
			sJsonPopup.StartStockQuantity = oItem.StartStockQuantity;
			sJsonPopup.StartSpecialStockTypeLabel = oItem.StartSpecialStockTypeLabel;
			sJsonPopup.StartSpecialStockTypes.push(oItem);
			// Consignment stock instead of project stock
			oItem = {};
			oItem.StartSpecialStockType = "K";
			oItem.StartSpecialStockTypeLabel = this.getResourceBundle().getText("SPECIALSTOCK_CONSIGNMENT");
			this._setTotalSpecialStockQuantity(oFirstEvtContainer, oItem);
			sJsonPopup.StartSpecialStockTypes.push(oItem);

			if (oFirstEvtContainer.SpecialStockType === "K") {
				aFilters = this._getFiltersSpecialStock(oFirstEvtContainer, sJsonPopup);
				sJsonPopup.ManagedStockTypes = this._getAllowedActions(oItem.StartStockQuantity);
			}
			var oModel = new sap.ui.model.json.JSONModel(sJsonPopup); // use this model to bind to dialog
			oModel.setSizeLimit(1000);
			this._displayPostDialogManage(oModel, this._oValueHelpSpecialStockModel, aFilters, sJsonPopup.StartStockType, sJsonPopup.StartSpecialStockType);

		},
			S1Controller.prototype._updateFrontendData = function (oJson, iPlant) {
				for (var v = 0; v < this._visibleStockTypes.length; v++) {
					oJson[this._visibleStockTypes[v] + "Int"] = parseInt(this._Material2Plants[iPlant][this._visibleStockTypes[
						v]]);
					oJson[this._visibleStockTypes[v]] = this._Material2Plants[iPlant][this._visibleStockTypes[v]];
				}

				var oDateFormatter = DateFormat.getDateInstance({
					style: "medium",
					strictParsing: true,
					relative: false,
					calendarType: "Gregorian",
					UTC: true
				});
				oJson.Plant = this._Material2Plants[iPlant].Plant;
				oJson.Batch = this._Material2Plants[iPlant].Batch;
				oJson.PlantName = this._Material2Plants[iPlant].PlantName;
				oJson.IsNegativeStockAllowed = this._Material2Plants[iPlant].IsNegativeStockAllowed;
				oJson.BatchInRestrictedUseStock = this._Material2Plants[iPlant].BatchInRestrictedUseStock;
				oJson.IsQualityManagedMaterial = this._Material2Plants[iPlant].IsQualityManagedMaterial;
				oJson.BatchVisible = this._Material2Plants[iPlant].MaterialIsBatchManaged;
				oJson.Items = [];
				oJson.ShelfLifeExpirationDate = this._Material2Plants[iPlant].ShelfLifeExpirationDate ? oDateFormatter.format(this._Material2Plants[
					iPlant].ShelfLifeExpirationDate) : null;
				oJson.ManufactureDate = this._Material2Plants[iPlant].ManufactureDate ? oDateFormatter.format(this._Material2Plants[iPlant].ManufactureDate) :
					null;
				oJson.ControlOfSerialNoTableField = this._Material2Plants[iPlant].ControlOfSerialNoTableField; //CE2105
				var oItem = {};
				for (var i = 0; i < this._Material2Plants[iPlant].Plant2StorLocs.results.length; i++) {
					oItem = {};
					oItem.StorageLocation = this._Material2Plants[iPlant].Plant2StorLocs.results[i].StorageLocation;
					oItem.StorageLocationName = this._Material2Plants[iPlant].Plant2StorLocs.results[i].StorageLocationName;
					oItem.WarehouseStorageBin = this._Material2Plants[iPlant].Plant2StorLocs.results[i].WarehouseStorageBin;
					if (oItem.WarehouseStorageBin) {
						oItem.WarehouseStorageBinText = this.getResourceBundle().getText("WAREHOUSESTORAGEBIN") + " " + oItem.WarehouseStorageBin;
					} else {
						oItem.WarehouseStorageBinText = "";
					}

					for (var w = 0; w < this._visibleStockTypes.length; w++) {
						oItem[this._visibleStockTypes[w]] = this._Material2Plants[iPlant].Plant2StorLocs.results[i][this._visibleStockTypes[
							w]];
						oItem[this._visibleStockTypes[w] + "SpecialStockExists"] = false; //indicator on special stock types default
					}
					oItem.InventorySpecialStockType = {}; //Map with key AssignmentReference == name of field in oData Service
					//special stocks if read
					if (this._Material2Plants[iPlant].Plant2StorLocs.results[i].MatStorLoc2MatStorLocSpecial.results) { //exist?
						for (var x = 0; x < this._Material2Plants[iPlant].Plant2StorLocs.results[i].MatStorLoc2MatStorLocSpecial.results
							.length; x++) {
							if (this._Material2Plants[iPlant].Plant2StorLocs.results[i].MatStorLoc2MatStorLocSpecial.results[x].InventorySpecialStockType ===
								"K" || //Vendor consignment
								this._Material2Plants[iPlant].Plant2StorLocs.results[i].MatStorLoc2MatStorLocSpecial.results[x].InventorySpecialStockType ===
								"Q" || //Project Stock
								this._Material2Plants[iPlant].Plant2StorLocs.results[i].MatStorLoc2MatStorLocSpecial.results[x].InventorySpecialStockType ===
								"E") { //sales order stock
								if (!oItem.InventorySpecialStockType[this._Material2Plants[iPlant].Plant2StorLocs.results[i].MatStorLoc2MatStorLocSpecial
									.results[x].AssignmentReference]) { //create array if needed
									oItem.InventorySpecialStockType[this._Material2Plants[iPlant].Plant2StorLocs.results[i].MatStorLoc2MatStorLocSpecial
										.results[x].AssignmentReference] = {
										InventorySpecialStockType: []
									};
								}
								//Indicator that special stock exists
								//Enabling Project Special stock for manage app
								if (this._startAppAction === "transferStock" || this._startAppAction === "manageStock" || this._Material2Plants[iPlant].Plant2StorLocs.results[i].MatStorLoc2MatStorLocSpecial
									.results[x].InventorySpecialStockType === "K") {
									oItem[this._Material2Plants[iPlant].Plant2StorLocs.results[i].MatStorLoc2MatStorLocSpecial
										.results[x].AssignmentReference + "SpecialStockExists"] = true;
									oItem.InventorySpecialStockType[this._Material2Plants[iPlant].Plant2StorLocs.results[i].MatStorLoc2MatStorLocSpecial
										.results[x].AssignmentReference].InventorySpecialStockType.push({
											InventorySpecialStockType: this._Material2Plants[iPlant].Plant2StorLocs.results[i].MatStorLoc2MatStorLocSpecial
												.results[
												x].InventorySpecialStockType,
											InventorySpecialStockTypeName: this._Material2Plants[iPlant].Plant2StorLocs.results[i].MatStorLoc2MatStorLocSpecial
												.results[
												x].InventorySpecialStockTypeName,
											Quantity: this._Material2Plants[iPlant].Plant2StorLocs.results[i].MatStorLoc2MatStorLocSpecial.results[
												x]
												.Quantity
										});
								}
							}
						} //special stock types
					} //exist?

					oJson.Items.push(oItem);
				};
			}

		return ControllerExtension.extend("customer.hartlauer.at.zmanagestock.zmanageStockExt", {
			// metadata: {
			// 	// extension can declare the public methods
			// 	// in general methods that start with "_" are private
			// 	methods: {
			// 		publicMethod: {
			// 			public: true /*default*/ ,
			// 			final: false /*default*/ ,
			// 			overrideExecution: OverrideExecution.Instead /*default*/
			// 		},
			// 		finalPublicMethod: {
			// 			final: true
			// 		},
			// 		onMyHook: {
			// 			public: true /*default*/ ,
			// 			final: false /*default*/ ,
			// 			overrideExecution: OverrideExecution.After
			// 		},
			// 		couldBePrivate: {
			// 			public: false
			// 		}
			// 	}
			// },

			// // adding a private method, only accessible from this controller extension
			// _privateMethod: function() {},
			// // adding a public method, might be called from or overridden by other controller extensions as well
			// publicMethod: function() {},
			// // adding final public method, might be called from, but not overridden by other controller extensions as well
			// finalPublicMethod: function() {},
			// // adding a hook method, might be called by or overridden from other controller extensions
			// // override these method does not replace the implementation, but executes after the original method
			// onMyHook: function() {},
			// // method public per default, but made private via metadata
			// couldBePrivate: function() {},
			// // this section allows to extend lifecycle hooks or override public methods of the base controller
			//override: {

			// Creates the modal pop up during managae containing source
			// @private
			// @param {Object} oFirstEvtContainer Contains all data of the first click
			//

			// 	/**
			// 	 * Called when a controller is instantiated and its View controls (if available) are already created.
			// 	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
			// 	 * @memberOf customer.hartlauer.at.zmanagestock.zmanageStockExt
			// 	 */
			// 	onInit: function() {
			// 	},

			// 	/**
			// 	 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
			// 	 * (NOT before the first rendering! onInit() is used for that one!).
			// 	 * @memberOf customer.hartlauer.at.zmanagestock.zmanageStockExt
			// 	 */
			// 	onBeforeRendering: function() {
			// 	},

			// 	/**
			// 	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
			// 	 * This hook is the same one that SAPUI5 controls get after being rendered.
			// 	 * @memberOf customer.hartlauer.at.zmanagestock.zmanageStockExt
			// 	 */
			// 	onAfterRendering: function() {
			// 	},

			// 	/**
			// 	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
			// 	 * @memberOf customer.hartlauer.at.zmanagestock.zmanageStockExt
			// 	 */
			// 	onExit: function() {
			// 	},

			// 	// override public method of the base controller
			// 	basePublicMethod: function() {
			// 	}

			//}
		});
	});