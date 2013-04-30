/*!
 * Syonet Bootstrap v0.0.0 - 2013-04-30
 * O conjunto de ferramentas front-end da Syonet
 * http://syonet.github.com/bootstrap/
 *
 * Created by Syonet CRM <syonet@syonet.com>
 * http://www.syonet.com
 */

(function( $ ) {
	"use strict";

	$.widget( "ui.syoButton", {
		version: "0.0.0",
		options: {
			multi: true,
			toggling: true,
			buttons: ":button, :submit, :reset, a",

			// Callbacks
			beforeToggle: null,
			toggle: null
		},

		// "Cache" utilizado basicamente pra quando é buttonset
		buttons:                null,
		buttonset:              false,

		// Classes utilizadas pelo plugin
		// @TODO utilizar as classes de estado do jQuery UI mesmo
		widgetButtonClass:      "syo-button",
		activeClass:            "syo-active",
		disabledClass:          "syo-disabled",
		widgetButtonsetClass:   "syo-buttonset",

		_create: function() {
			if ( this.element.is( this.options.buttons ) ) {
				this.buttons = this.element;
			} else {
				this.buttonset = true;

				this.element.addClass("syo-buttonset");
				this.buttons = this.element.children( this.options.buttons );
			}

			this.buttons.on( "tap.syobutton click.syobutton", $.proxy( this._toggle, this ) );
			this.refresh();
		},

		_setOption: function( key, value ) {
			// Se desabilitando opção "toggling"
			if ( key === "toggling" && !value ) {
				if ( this.buttonset ) {
					// Desativa do 2º botão em diante
					this.element.find( "." + this.activeClass )
						.slice( 1 )
						.removeClass( this.activeClass );
				} else {
					this.element.removeClass( this.activeClass );
				}
			}

			this._super( key, value );
		},

		_toggle: function( e ) {
			var eventData = { };

			// Tem que ter preventDefault() por causa do jQuery Mobile.
			e.preventDefault();
			e.stopPropagation();

			eventData.active = this.options.toggling ?
				$( e.currentTarget ).hasClass( this.activeClass ) :
				null;

			// Permite cancelar o toggle
			if ( this._trigger( "beforeToggle", e, eventData ) === false ) {
				return;
			}

			if ( this.options.toggling ) {
				// Habilita múltiplos itens ativos ao mesmo tempo num buttonset?
				if ( this.buttonset && !this.options.multi ) {
					this.buttons.removeClass( this.activeClass );
				}

				$( e.currentTarget ).toggleClass( this.activeClass );
				eventData.active = !eventData.active;
			}

			this._trigger( "toggle", e, eventData );
		},

		_toggleDisable: function( item, disabled ) {
			var i, len, $item;
			item = item ? ( $.isArray( item ) ? item : [ item ] ) : [];

			// Se não foi passado nada, então habilita/desabilita todos itens
			if ( !item.length ) {
				for ( i = 0, len = this.buttons.length; i < len; i++ ) {
					item.push( i );
				}
			}

			for ( i = 0, len = item.length; i < len; i++ ) {
				$item = this.buttons.eq( item[ i ] )
					.attr( "aria-hidden", disabled ? "true" : "false" )
					.toggleClass(  this.disabledClass, disabled );

				if ( disabled ) {
					$item.attr( "aria-selected", "false" );
				}
			}
		},
		disable: function( item ) {
			this._toggleDisable( item, true );
		},
		enable: function( item ) {
			this._toggleDisable( item, false );
		},

		refresh: function() {
			if ( this.buttonset ) {
				// Esconde tudo que não for botão
				this.element.children( ":not(" + this.options.buttons + ")" ).hide();
			}

			this.buttons
				.removeClass( [ this.activeClass, this.disabledClass ].join(" ") )
				.addClass( this.widgetButtonClass );
		},

		_destroy: function() {
			if ( this.buttonset ) {
				this.element.removeClass( this.widgetButtonsetClass );
			}

			this.buttons
				.unbind(".syobutton")
				.removeClass( this.widgetButtonClass );
		}
	});

})( jQuery );
(function( $ ) {
	"use strict";

	$.widget( "ui.syoPagination", {
		version: "0.0.0",
		options: {
			active: 0,
			items: 1,
			inline: false,

			// Callbacks
			activate: null,
			beforeActivate: null
		},

		// Classes CSS
		widgetClass:        "syo-pagination",
		widgetInlineClass:  "syo-pagination-inline",
		activeClass:        "syo-active",
		disabledClass:      "syo-disabled",

		// Criação da estrutura do syoPagination
		_create: function() {
			this.element.attr( "role", "navigation" ).addClass( this.widgetClass );
			this.list = $("<ul />").appendTo( this.element );

			// Instancia os eventos
			this._setupEvents();

			// Seta o widget como inline, caso necessário
			this._toggleInline( this.options.inline );

			// Cria os LIs de fato
			this.refresh();
		},

		_setupEvents: function() {
			var widget = this;

			this.list.on( "click", "> li", function( e ) {
				e.stopPropagation();
				e.preventDefault();

				if ( $( this ).hasClass( widget.disabledClass ) ) {
					return;
				}

				widget._activate( widget.items.index( this ) );
			});
		},
		_setOption: function( key, value ) {
			if ( key === "active" ) {
				this._activate( value );
				return;
			}

			if ( key === "items" ) {
				// Faz o cast correto para number
				value = +value;

				if ( isNaN( value ) ) {
					return;
				}

				this._super( key, value );
				this.refresh();
			} else {
				this._super( key, value );
			}

			if ( key === "inline" ) {
				this._toggleInline( value );
			}
		},

		_toggleInline: function( toggle ) {
			this.element.toggleClass( this.widgetInlineClass, toggle );
		},

		_findItem: function( selector ) {
			return typeof selector === "number" ? this.items.eq( selector ) : $();
		},

		_activate: function( index ) {
			var active = this._findItem( index );

			// Tentando ativar o item já ativo da paginação, ou tentando ativar um item inexistente
			if ( !active || index === this.active ) {
				return;
			}

			// Monta o objeto para passar para o jQuery UI Widget
			var event = {
				target: active,
				currentTarget: active,
				preventDefault: $.noop
			}, clicked = $( event.currentTarget );

			// Monta o objeto que será passado para o evento
			var eventData = {
				oldItem: this._findItem( this.options.active ),
				newItem: clicked
			};

			event.preventDefault();

			// Permite cancelar a ativação do item
			if ( this._trigger( "beforeActivate", event, eventData ) === false ) {
				return;
			}

			this.options.active = this.active = index;
			this._toggleActive( eventData );
		},
		_toggleActive: function( data ) {
			data.oldItem.attr( "aria-selected", "false" ).removeClass( this.activeClass );
			data.newItem.attr( "aria-selected", "true" ).addClass( this.activeClass );

			this._trigger( "activate", null, data );
		},

		refresh: function() {
			var li;
			var i = 0;

			// Limpa a lista da paginação
			this.list.empty();
			this.items = $();

			for ( ; i < this.options.items; i++ ) {
				li = $( "<li />", {
					"aria-selected": "false",
					"aria-hidden": "false"
				});

				li.append(
					$("<a href='#' />").text( i + 1 )
				).appendTo( this.list );

				this.items = this.items.add( li );
			}

			// Variável helper pra resetar o estado de itens ativos
			this.active = -1;

			// Retorna à página 0
			this._activate( 0 );
		},

		_toggleDisable: function( item, disabled ) {
			var i, len, $item;
			item = item ? ( $.isArray( item ) ? item : [ item ] ) : [];

			// Se não foi passado nada, então habilita/desabilita todos itens
			if ( !item.length ) {
				for ( i = 0, len = this.items.length; i < len; i++ ) {
					item.push( i );
				}
			}

			for ( i = 0, len = item.length; i < len; i++ ) {
				$item = this.items.eq( item[ i ] )
					.attr( "aria-hidden", disabled ? "true" : "false" )
					.toggleClass(  this.disabledClass, disabled );

				if ( disabled ) {
					$item.attr( "aria-selected", "false" );
				}
			}
		},
		enable: function( item ) {
			this._toggleDisable( item, false );
		},
		disable: function( item ) {
			this._toggleDisable( item, true );
		},

		_destroy: function() {
			this.list.remove();
			this.element.removeAttr("role").removeClass( this.widgetClass );
		}
	});

})( jQuery );
(function( $, document ) {
	"use strict";

	$.widget( "ui.syoPopover", {
		version: "0.0.0",
		options: {
			title:      "",
			element:    null,
			position:   "top",

			// Opções de animação
			show: null,
			hide: null
		},

		classes: {
			widget:     "syo-popover",
			titlebar:   "syo-popover-titlebar",
			title:      "syo-popover-title",
			close:      "syo-popover-close",
			arrow:      "syo-popover-arrow",
			content:    "syo-popover-content",
			hidden:     "syo-hidden"
		},

		_isOpen: false,
		parent: null,

		_create: function() {
			// Guarda posição atual pra quando chamar destroy restaurar
			this.oldPosition = {
				parent: this.element.parent(),
				index:  this.element.parent().children().index( this.element )
			};

			this.refresh();
			this._setupEvents();

			// Seta novamente, pro caso do cara não ter passado a propriedade na inicialização
			this._setOption( "element", this.options.element );
		},

		_setOption: function( key, value ) {
			if ( key === "element" ) {
				// Se valor falso passado, utiliza o primeiro elemento do body.
				value = value || document.body.children[ 0 ];

				if ( value instanceof $ || value.nodeType || typeof value === "string" ) {
					this.parent = $( value );
					this._super( key, value );
					this._position();
				}

				return;
			}

			if ( key === "position" ) {
				value = value.toLowerCase();

				if ( !/(top|right|bottom|left)(-(start|end))?/.test( value ) ) {
					value = "top";
				}
			}

			this._super( key, value );
			this.refresh();
		},

		_setupEvents: function() {
			// Fecha no click do closethick
			$( this.popover ).on(
				"click." + this.widgetEventPrefix,
				"." + this.classes.close,
				$.proxy( this.close, this )
			);

			// Fecha no tap do title
			$( this.popover ).on(
				"tap." + this.widgetEventPrefix,
				"." + this.classes.titlebar,
				$.proxy( this.close, this )
			);
		},

		_getTitle: function() {
			if ( this.options.title instanceof $ || this.options.title.nodeType ) {
				return $( this.options.title ).html();
			} else if ( !this.options.title ) {
				return "";
			}

			return this.options.title.toString();
		},

		_position: function() {
			if ( !this._isOpen ) {
				return;
			}

			var position = {},
				positionValue = this.options.position.split("-"),
				myPos = this.parent.offset(),
				posClassPrefix = this.classes.widget + "-",
				posClass = this.options.position;

			switch ( positionValue[ 0 ] ) {
				case "top":
					position.at = "center top-20";
					position.my = "center bottom";
					break;

				case "right":
					position.at = "right+20 center";
					position.my = "left center";
					break;

				case "bottom":
					position.at = "center bottom+20";
					position.my = "center top";
					break;

				case "left":
					position.at = "left-20 center";
					position.my = "right center";
					break;
			}

			if ( positionValue[ 1 ] ) {
				var atStart = positionValue[ 1 ] === "start";

				if ( positionValue[ 0 ] === "top" || positionValue[ 0 ] === "bottom" ) {
					position.at = position.at.replace( "center", atStart ? "left" : "right" );
				} else {
					position.at = position.at.replace( "center", atStart ? "top" : "bottom" );
				}

				position.my = position.my.replace(
					"center",
					atStart ? "center+40%" : "center-40%"
				);
			}

			position.of         = this.parent;
			position.within     = this.parent;

			// @FIXME collision = flip não funciona no Firefox Android :'(
			position.collision  = "none";

			position = this.popover.position( position ).offset();

			// Adiciona a classe certa, de acordo com a posição do popover em relação ao botão
			if ( positionValue[ 0 ] === "top" || positionValue[ 0 ] === "bottom" ) {
				posClass = position.top > myPos.top ? "bottom" : "top";
			} else {
				posClass = position.left > myPos.left ? "right" : "left";
			}

			posClass += positionValue[ 1 ] ? "-" + positionValue[ 1 ] : "";

			// Removemos outras classes de posicionamento do popover e setamos uma nova
			this.popover
				.attr( "class", this.classes.widget )
				.addClass( posClassPrefix + posClass );
		},

		isOpen: function() {
			return this._isOpen;
		},

		open: function() {
			this.popover.show( this.options.show );

			// Reposiciona o popover com o elemento
			this._isOpen = true;
			this._position();
		},

		close: function( e ) {
			// Evita que aconteça um "double tap" em touch devices
			if ( e instanceof $.Event ) {
				e.stopPropagation();
				e.preventDefault();
			}

			this._isOpen = false;
			this.popover.hide( this.options.hide );
		},

		refresh: function() {
			// Se ainda não existe o popover, cria ele
			if ( !this.popover ) {
				this.popover = $( "<div />", {
					class: this.classes.widget
				}).appendTo( document.body );

				this.popover.append(
					"<div class='" + this.classes.arrow + "'></div>" +
					"<div class='" + this.classes.titlebar + "'>" +
						"<div class='" + this.classes.title + "'></div>" +
						"<div class='" + this.classes.close + "'>" +
							"<i class='icon-remove-sign'></i>" +
						"</div>" +
					"</div>"
				);

				// Seta o elemento em que foi chamado o plugin como conteudo do popover
				this.popover.append( this.element.addClass( this.classes.content ) );
			}

			this.popover
				// Seta o titulo no popover
				.find( "." + this.classes.title )
					.html( this._getTitle() );

			// Reposiciona o popover, se ele estiver aberto
			this._position();
		},

		// Sobrescreve o método pai 'widget', do jQuery UI, e retorna o que interessa
		widget: function() {
			return this.popover;
		},

		_destroy: function() {
			var oldPosition = this.oldPosition,
				next = oldPosition.parent.children().eq( oldPosition.index );

			// Não tenta colocar o popover próximo dele mesmo.
			if ( next.length && next[ 0 ] !== this.element[ 0 ] ) {
				this.element.insertBefore( next );
			} else {
				oldPosition.parent.append( this.element );
			}

			this.element.removeClass( this.classes.content );
			this.popover.remove();
		}
	});

})( jQuery, document );