define(
    [
        'jquery',
        'Heidelpay_Gateway/js/view/payment/method-renderer/hgw-abstract',
        'Heidelpay_Gateway/js/action/place-order',
        'Magento_Checkout/js/model/url-builder',
        'mage/storage',
        'Magento_Checkout/js/model/payment/additional-validators',
        'Magento_Customer/js/model/customer',
        'Magento_Checkout/js/model/quote',
        'moment'
    ],
    function ($, Component, placeOrderAction, urlBuilder, storage, additionalValidators, customer, quote, moment) {
        'use strict';

        return Component.extend({

            /**
             * Property that indicates, if the payment method is storing
             * additional data.
             */
            savesAdditionalData: true,

            defaults: {
                template: 'Heidelpay_Gateway/payment/heidelpay-santander-invoice-form',
                hgwDobYear: '',
                hgwDobMonth: '',
                hgwDobDay: '',
                hgwSalutation: '',
                years: [null]
            },

            initialize: function () {
                this._super();
                this.getAdditionalPaymentInformation();

                // init years select menu
                for (var i = (new Date().getFullYear() - 17); i >= new Date().getFullYear() - 120; i--) {
                    this.years.push(i);
                }

                return this;
            },

            initObservable: function() {
                this._super()
                    .observe(['hgwSalutation', 'hgwDobYear', 'hgwDobMonth', 'hgwDobDay', 'years']);

                return this;
            },


            getAdditionalPaymentInformation: function() {
                // recognition: only when there is a logged in customer
                if (customer.isLoggedIn()) {
                    // if we have a shipping address, go on
                    if( quote.shippingAddress() !== null ) {
                        var parent = this;
                        var serviceUrl = urlBuilder.createUrl('/hgw/get-payment-info', {});
                        var hgwPayload = {
                            quoteId: quote.getQuoteId(),
                            paymentMethod: this.item.method
                        };

                        storage.post(
                            serviceUrl, JSON.stringify(hgwPayload)
                        ).done(
                            function(data) {
                                var info = JSON.parse(data);

                                // set salutation and birthdate, if set.
                                if( info !== null ) {
                                    if (info.hasOwnProperty('hgw_salutation'))
                                        parent.hgwSalutation(info.hgw_salutation);

                                    if (info.hasOwnProperty('hgw_birthdate') && info.hgw_birthdate !== null) {
                                        var date = moment(info.hgw_birthdate, 'YYYY-MM-DD');

                                        parent.hgwDobDay(date.date());
                                        parent.hgwDobMonth(date.month());
                                        parent.hgwDobYear(date.year());

                                        // workaround: if month is 'january', the month isn't selected.
                                        if (date.month() === 0) {
                                            $("#hgwivs_birthdate_month option:eq(1)").prop('selected', true);
                                        }
                                    }
                                }
                            }
                        );
                    }
                }
            },

            getCode: function () {
                return 'hgwsantanderiv';
            },

            getData: function () {
                return {
                    'method': this.item.method,
                    'additional_data': {
                        'hgw_birthdate': this.getBirthdate(),
                        'hgw_salutation': this.hgwSalutation()
                    }
                };
            },

            /**
             * Returns the birthdate in ISO 8601 format.
             *
             * @returns {string}
             */
            getBirthdate: function () {
                return moment(
                    new Date(this.hgwDobYear(), this.hgwDobMonth(), this.hgwDobDay())
                ).format('YYYY-MM-DD');
            },

            validate: function() {
                var form = $('#hgw-santander-invoice-form');

                return form.validation() && form.validation('isValid');
            }
        });
    }
);