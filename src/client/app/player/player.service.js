(function() {
    'use strict';

    angular
        .module('app.player')
        .service('playerService', playerService);


    playerService.$inject = ['inventoryService', 'messageService'];

    /* @ngInject */
    function playerService(inventoryService, messageService) {

        ////////////////
        var vm = this;
        vm.itemDictionary = inventoryService.itemDictionary;
        this.Player = function() {
            this.rest = function() {
                this.health = this.maxHealth;
            },
            this.abilities = {
                keys: ['berserk', 'block'],
                berserk: {
                    name: 'Berserk',
                    slug: 'berserk',
                    text: 'Attacks deal double damage',
                    unlocked: true,
                    active: false,
                    timer: 0,
                    max: 100,
                    cd: 0,
                    cdMax: 200,
                    special: function() {
                        this.timer = this.max;
                        this.active = true;
                    }
                },
                block: {
                    name: 'Block',
                    slug: 'block',
                    text: 'Blocks incoming damage',
                    unlocked: true,
                    active: false,
                    timer: 0,
                    max: 50,
                    cd: 0,
                    cdMax: 200,
                    special: function() {
                        this.timer = this.max;
                        this.active = true;
                    }
                },
                resetAbilities: function() {
                    for (var i = 0; i < this.keys.length; i++) {
                        this[this.keys[i]].active = false;
                        this[this.keys[i]].cd = 0;
                        this[this.keys[i]].timer = 0;
                    }
                }
            },
            this.specialEnd = undefined,
            this.money = 1000,
            this.usePotion = function() {
                if (inventoryService.itemDictionary.potion[1][1] > 0) {
                    var health = parseFloat(this.health);                
                    this.health = (health + this.maxHealth/2).toFixed(2);
                    inventoryService.itemDictionary.potion[1][1] = inventoryService.itemDictionary.potion[1][1] - 1;
                }
                else {
                    messageService.updateMainMessage('You have no potions.', true);
                }
            },
            this.healthPercent = function() {
                var percent = (this.health / this.maxHealth)*100;
                return percent;
            },
            this.checkMaxHealth = function() {
                if (this.health > this.maxHealth) {
                    this.health = this.maxHealth;
                }
            },
            this.healthRegen = function() {
                if (this.health < 0) {
                    this.health = 0;
                }
                if (this.health < this.maxHealth) {
                    var health = parseFloat(this.health);
                    this.health = (health + this.regen).toFixed(2);
                }
                this.checkMaxHealth();
            },
            this.healthBarUpdate = function(enemy) {
                this.checkMaxHealth();
                var percent = this.healthPercent();
                if (percent > 65) {
                    this.healthWidth = {'background-color': 'green', 'width': percent + '%'};
                }
                else if (40 < percent) {
                    this.healthWidth = {'background-color': 'orange', 'width': percent + '%'};
                }
                else {
                    this.healthWidth = {'background-color': 'red', 'width': percent + '%'};
                }
            },
            this.updatePosition = function(unit, unitOld, x, y) {
                unitOld[0] = unit[0];
                unitOld[1] = unit[1];
                unit[1] = unit[1] + y;
                unit[0] = unit[0] + x;
            },
            this.prevTile = function(unitOld, map) {
                map[unitOld[1]] = setCharAt(map[unitOld[1]], unitOld[0], '_');
            },
            this.endLevel = function() {
                messageService.addMessage('You have reached the end of the level');
                this.active = false;
                this.levelComplete = true;
                messageService.updateMainMessage('You finish the level.');
                return true;
            },
            this.checkLevelEnd = function(unit, map) {
                if (map[unit[1]].length <= unit[0]) {
                    this.endLevel();
                }
                else if (typeof this.specialEnd !== 'undefined') {
                    if (this.specialEnd <= unit[0]) {
                        this.endLevel();
                    }
                }
            },
            //needs rework
            this.collisionCheck = function(map, enemyArray) {
                var current = this;
                current.levelComplete = false;
                if (current.alive) {
                    current.checkLevelEnd(current.position, map);
                    if (current.grounded) {
                        current.grounded = false;
                        var groundedLastTurn = true;
                    }
                    if (current.prev) {
                        current.prevCheck = true;
                        current.prev = false;
                    }
                    else {
                        current.prevCheck = false;
                    }
                    
                    for (var i = 0; i < enemyArray.length; i++) {
                        if ((map[current.position[1]][current.position[0] + current.speed]) === (enemyArray[i].symbol)) {
                            inCombat = true;
                        }
                    }
                    if (inCombat) {
                    }
                    //collission detection y
                    else if (((map[current.position[1] + 1][current.position[0]] === ' ')||(map[current.position[1] + 1][current.position[0]] === '_')) && !current.prevCheck) {
                        current.updatePosition(current.position, current.positionOld, 0, 1);
                        if (map[current.position[1]][current.position[0]] === '_') {
                            current.prev = true;
                        }
                    }
                     //collision detection x
                    else if (map[current.position[1]][current.position[0] + current.speed] === ' ') {
                        current.updatePosition(current.position, current.positionOld, current.speed, 0);
                    }
                    //collision detection with replacable tiles
                    else if (map[current.position[1]][current.position[0] + current.speed] === '_') {
                        current.prev = true;
                        current.updatePosition(current.position, current.positionOld, current.speed, 0);
                    }
                    else if ((map[current.position[1]][current.position[0] + current.speed] === 'Y')) {
                        if (current.symbol === 'Y') {
                            var inCombat = false;
                            for (var i = 0; i < enemyArray.length; i++) {
                                if ((map[current.position[1]][current.position[0] + current.speed]) === (enemyArray[i].symbol)) {
                                    inCombat = true;
                                }
                            }
                            if (!inCombat) {
                                current.updatePosition(current.position, current.positionOld, current.speed, -1);
                            }
                        }
                    }
                    // else {
                    //     setTimeout(function() {
                    //         var wait = true;
                    //     }, 1000);
                    // }
                    //move up and over if nothing else possible
                    else {
                        var cantMove = false;
                        for (var i = 0; i < enemyArray.length; i++) {
                            if (map[current.position[1]][current.position[0] + current.speed] === enemyArray[i].symbol) {
                                cantMove = true;
                            }
                        }
                        if (!cantMove) {
                            current.updatePosition(current.position, current.positionOld, current.speed, -1);                            
                        }
                    }
                    // if (current.prevCheck) {
                    //     console.log('test');
                    //     prevTile(current.positionOld, map);
                    // }
                    // $scope.$apply();
                }   
                else {
                    messageService.updateMainMessage('You have been slain.', true);
                    return;
                }
            },
            this.calculateTotalDamage = function() {
                var damage = this.weapon.damage;
                if (this.abilities.berserk.active) {
                    damage = this.weapon.damage*2;
                }
                return damage;
            },
            this.calculateTotalArmor = function() {
                var armor = this.armor.armor;
                if (this.abilities.block.active) {
                    armor = 1;
                }
                return armor;
            },
            this.trueSelf = {
                offense: false,
                defense: false,
                healing: false
            },
            this.active = true,
            this.ground = false,
            this.health = 100,
            this.maxHealth = 100,
            this.regen = 1,
            this.alive = true,
            //movement
            this.prev = false,
            this.prevCheck = false,
            this.speed = 1,
            this.position = [0, 0],
            this.positionOld = [0, 0],
            this.initPosition = function() {
                this.positionOld = this.position;
            },
            //other
            this.position = [0, 0],
            this.positionOld = [0, 0],
            this.name = 'Player',
            this.symbol = 'Y',
            this.desc = 'This is you',
            //attack
            this.weapon = vm.itemDictionary.fists[0][1],
            this.damage = this.calculateTotalDamage(),
            this.attackSpeed = this.weapon.attackSpeed,
            //armor
            this.armor = vm.itemDictionary.clothArmor[0][1],
            this.armorValue = this.armor.armor,
            //money
            this.gold = 0
        },
        this.player = new this.Player(),
        this.player.calculateTotalDamage()
    }
})();