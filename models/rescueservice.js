'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RescueService extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  RescueService.init({
    name: DataTypes.STRING,
    service_type: DataTypes.STRING,
    contact_number: DataTypes.STRING,
    description: DataTypes.TEXT,
    is_active: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'RescueService',
  });
  return RescueService;
};